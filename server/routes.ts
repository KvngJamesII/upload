import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import bcrypt from "bcrypt";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import rateLimit from "express-rate-limit";
import axios from "axios";
import { nanoid } from "nanoid";
import { z } from "zod";
import { loginSchema, signupSchema } from "@shared/schema";
import type { User, Country } from "@shared/schema";
import { db } from "./db";
import { sql } from "drizzle-orm";

// Extend Express Request to include user
declare global {
  namespace Express {
    interface User extends import("@shared/schema").User {}
  }
}

// Helper function to get client IP
function getClientIP(req: Request): string {
  return (req.headers['x-forwarded-for'] as string)?.split(',')[0] || 
         req.socket.remoteAddress || 
         'unknown';
}

// Middleware to check if user is authenticated
function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Not authenticated" });
}

// Middleware to check if user is admin
function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated() && req.user?.isAdmin) {
    return next();
  }
  res.status(403).json({ message: "Admin access required" });
}

// Rate limiters
const numberLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
});

const smsLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // 5 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Session configuration
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "otp-king-secret-key-change-in-production",
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      },
    })
  );

  // Passport configuration
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user) {
          return done(null, false, { message: "Invalid username or password" });
        }

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
          return done(null, false, { message: "Invalid username or password" });
        }

        if (user.isBanned) {
          return done(null, false, { message: "Account is banned" });
        }

        return done(null, user);
      } catch (error) {
        return done(error);
      }
    })
  );

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  // ====================
  // Authentication Routes
  // ====================

  app.post("/api/auth/signup", async (req: Request, res: Response) => {
    try {
      const data = signupSchema.parse(req.body);
      const ipAddress = getClientIP(req);

      // Check for existing username
      const existingUser = await storage.getUserByUsername(data.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      // Check for IP-based multiple accounts
      const existingIP = await storage.getUserByIP(ipAddress);
      if (existingIP) {
        return res.status(400).json({ 
          message: "Multiple accounts from the same IP are not allowed" 
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(data.password, 10);

      // Generate unique referral code
      const referralCode = nanoid(10);

      // Create user
      const user = await storage.createUser({
        username: data.username,
        password: hashedPassword,
        email: data.email || null,
        referralCode,
        referredBy: data.referralCode || null,
        ipAddress,
      });

      // If user was referred, reward the referrer
      if (data.referralCode) {
        const [referrer] = await db.select().from(users).where(eq(users.referralCode, data.referralCode));

        if (referrer) {
          await storage.updateUser(referrer.id, {
            credits: (referrer.credits || 0) + 50, // Bonus for successful referral
            successfulReferrals: (referrer.successfulReferrals || 0) + 1,
          });

          // Send notification to referrer
          await storage.createNotification({
            userId: referrer.id,
            title: "New Referral!",
            message: `${data.username} joined using your referral code. You earned 50 credits!`,
            isBroadcast: false,
          });
        }
      }

      // Log in the new user
      req.login(user, (err) => {
        if (err) {
          return res.status(500).json({ message: "Error logging in after signup" });
        }
        res.json({ success: true, user });
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: error.message || "Signup failed" });
    }
  });

  app.post("/api/auth/login", (req: Request, res: Response, next: NextFunction) => {
    try {
      loginSchema.parse(req.body);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
    }

    passport.authenticate("local", async (err: any, user: User, info: any) => {
      if (err) {
        return res.status(500).json({ message: "Authentication error" });
      }
      if (!user) {
        return res.status(401).json({ message: info?.message || "Authentication failed" });
      }

      req.login(user, async (loginErr) => {
        if (loginErr) {
          return res.status(500).json({ message: "Login failed" });
        }

        // Check for daily login reward
        const now = new Date();
        const lastLogin = user.lastLoginDate ? new Date(user.lastLoginDate) : null;
        
        const shouldReward = !lastLogin || 
          (now.getTime() - lastLogin.getTime()) > 24 * 60 * 60 * 1000;

        if (shouldReward) {
          await storage.updateUser(user.id, {
            credits: (user.credits || 0) + 50,
            lastLoginDate: now,
          });

          await storage.createNotification({
            userId: user.id,
            title: "Daily Reward!",
            message: "You earned 50 credits for logging in today!",
            isBroadcast: false,
          });
        }

        res.json({ success: true, isAdmin: user.isAdmin });
      });
    })(req, res, next);
  });

  app.post("/api/auth/logout", (req: Request, res: Response) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ success: true });
    });
  });

  app.get("/api/auth/me", requireAuth, (req: Request, res: Response) => {
    res.json(req.user);
  });

  // ====================
  // Maintenance Route (Public)
  // ====================

  app.get("/api/maintenance", async (req: Request, res: Response) => {
    try {
      const setting = await storage.getSetting("maintenance_mode");
      res.json({ enabled: setting?.value === "true" });
    } catch (error) {
      res.json({ enabled: false });
    }
  });

  // ====================
  // Country Routes
  // ====================

  app.get("/api/countries", async (req: Request, res: Response) => {
    try {
      const countries = await storage.getCountries();
      res.json(countries);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/countries/:id", async (req: Request, res: Response) => {
    try {
      const country = await storage.getCountry(req.params.id);
      if (!country) {
        return res.status(404).json({ message: "Country not found" });
      }
      res.json(country);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/countries/:id/use-number", requireAuth, numberLimiter, async (req: Request, res: Response) => {
    try {
      const user = req.user!;
      const country = await storage.getCountry(req.params.id);

      if (!country) {
        return res.status(404).json({ message: "Country not found" });
      }

      if (user.credits < 5) {
        return res.status(400).json({ message: "Insufficient credits. You need 5 credits to use a number." });
      }

      // Parse numbers from file
      const numbers = country.numbersFile.split('\n').filter(n => n.trim());
      
      if (numbers.length === 0) {
        return res.status(400).json({ message: "No numbers available" });
      }

      // Get a random number
      const randomNumber = numbers[Math.floor(Math.random() * numbers.length)];

      // Deduct credits
      await storage.updateUser(user.id, {
        credits: user.credits - 5,
      });

      // Update country usage
      await storage.updateCountry(country.id, {
        usedNumbers: (country.usedNumbers || 0) + 1,
      });

      // Create history entry
      await storage.createNumberHistory({
        userId: user.id,
        countryId: country.id,
        phoneNumber: randomNumber,
      });

      res.json({ number: randomNumber });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ====================
  // SMS Routes
  // ====================

  app.get("/api/sms/:phoneNumber", requireAuth, async (req: Request, res: Response) => {
    try {
      const messages = await storage.getSmsMessages(req.params.phoneNumber);
      res.json(messages);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/sms/check/:phoneNumber", requireAuth, smsLimiter, async (req: Request, res: Response) => {
    try {
      const phoneNumber = req.params.phoneNumber;
      const apiToken = await storage.getSetting("sms_api_token");

      if (!apiToken) {
        return res.status(400).json({ message: "SMS API not configured" });
      }

      // Call external SMS API twice as specified
      let newMessages = 0;
      
      for (let i = 0; i < 2; i++) {
        const response = await axios.get("http://51.77.216.195/crapi/dgroup/viewstats", {
          params: {
            token: apiToken.value,
            filternum: phoneNumber,
            records: 50,
          },
          timeout: 10000,
        });

        if (response.data.status === "success" && response.data.data) {
          for (const msg of response.data.data) {
            // Check if message already exists
            const existing = await db.query.smsMessages.findFirst({
              where: sql`${sql.identifier('phone_number')} = ${msg.num} AND ${sql.identifier('sender')} = ${msg.cli} AND ${sql.identifier('message')} = ${msg.message}`,
            });

            if (!existing) {
              await storage.createSmsMessage({
                phoneNumber: msg.num,
                sender: msg.cli,
                message: msg.message,
                receivedAt: new Date(msg.dt),
              });
              newMessages++;
            }
          }
        }

        // Wait 1 second between requests
        if (i === 0) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      res.json({ newMessages });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to check SMS" });
    }
  });

  // ====================
  // History Routes
  // ====================

  app.get("/api/history", requireAuth, async (req: Request, res: Response) => {
    try {
      const history = await storage.getUserHistory(req.user!.id);
      
      // Enrich with country data
      const enriched = await Promise.all(
        history.map(async (item) => {
          const country = await storage.getCountry(item.countryId);
          return {
            ...item,
            country: country ? {
              id: country.id,
              name: country.name,
              code: country.code,
            } : null,
          };
        })
      );

      res.json(enriched);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ====================
  // Announcement Routes
  // ====================

  app.get("/api/announcements", async (req: Request, res: Response) => {
    try {
      const announcements = await storage.getAnnouncements();
      res.json(announcements);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ====================
  // Notification Routes
  // ====================

  app.get("/api/notifications", requireAuth, async (req: Request, res: Response) => {
    try {
      const notifications = await storage.getUserNotifications(req.user!.id);
      res.json(notifications);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ====================
  // Admin Routes
  // ====================

  // Statistics
  app.get("/api/admin/stats", requireAdmin, async (req: Request, res: Response) => {
    try {
      const users = await storage.getAllUsers();
      const countries = await storage.getCountries();
      
      const totalNumbersUsed = countries.reduce((sum, c) => sum + (c.usedNumbers || 0), 0);
      const smsCount = await db.query.smsMessages.findMany();

      const recentUsers = users.slice(0, 10).map(u => ({
        username: u.username,
        createdAt: u.createdAt,
      }));

      const countryUsage = await db.query.numberHistory.findMany();
      const countryUsageMap = new Map<string, number>();
      
      for (const usage of countryUsage) {
        countryUsageMap.set(usage.countryId, (countryUsageMap.get(usage.countryId) || 0) + 1);
      }

      const mostUsedCountries = await Promise.all(
        Array.from(countryUsageMap.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(async ([countryId, count]) => {
            const country = await storage.getCountry(countryId);
            return {
              name: country?.name || "Unknown",
              usedCount: count,
            };
          })
      );

      const maintenanceMode = await storage.getSetting("maintenance_mode");

      res.json({
        totalUsers: users.length,
        totalCountries: countries.length,
        totalNumbersUsed,
        totalSmsReceived: smsCount.length,
        maintenanceMode: maintenanceMode?.value === "true",
        recentUsers,
        mostUsedCountries,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Maintenance toggle
  app.post("/api/admin/maintenance", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { enabled } = req.body;
      await storage.setSetting({
        key: "maintenance_mode",
        value: enabled ? "true" : "false",
      });
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Country management
  app.post("/api/admin/countries", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { name, code, flagUrl, numbersFile } = req.body;
      
      // Count numbers
      const numbers = numbersFile.split('\n').filter((n: string) => n.trim());
      
      const country = await storage.createCountry({
        name,
        code,
        flagUrl,
        numbersFile,
        totalNumbers: numbers.length,
      });

      res.json(country);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/admin/countries/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      await storage.deleteCountry(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // API Settings
  app.get("/api/admin/settings/sms-api-token", requireAdmin, async (req: Request, res: Response) => {
    try {
      const setting = await storage.getSetting("sms_api_token");
      res.json({ value: setting?.value || "" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/admin/settings/sms-api-token", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { token } = req.body;
      await storage.setSetting({
        key: "sms_api_token",
        value: token,
      });
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // User management
  app.get("/api/admin/users", requireAdmin, async (req: Request, res: Response) => {
    try {
      const users = await storage.getAllUsers();
      
      // Enrich with usage stats
      const enriched = await Promise.all(
        users.map(async (user) => {
          const history = await storage.getUserHistory(user.id);
          return {
            ...user,
            numbersUsed: history.length,
          };
        })
      );

      res.json(enriched);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/admin/users/:id/ban", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { ban } = req.body;
      await storage.updateUser(req.params.id, { isBanned: ban });
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Notifications
  app.get("/api/admin/notifications", requireAdmin, async (req: Request, res: Response) => {
    try {
      const notifications = await storage.getAllNotifications();
      res.json(notifications);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/admin/notifications/broadcast", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { title, message } = req.body;
      const users = await storage.getAllUsers();

      // Create notification for each user
      for (const user of users) {
        await storage.createNotification({
          userId: user.id,
          title,
          message,
          isBroadcast: true,
        });
      }

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Announcements
  app.post("/api/admin/announcements", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { content } = req.body;
      const announcement = await storage.createAnnouncement({ content, isActive: true });
      res.json(announcement);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/admin/announcements/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { content } = req.body;
      const announcement = await storage.updateAnnouncement(req.params.id, content);
      res.json(announcement);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/admin/announcements/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      await storage.deleteAnnouncement(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/admin/announcements/:id/toggle", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { isActive } = req.body;
      await storage.toggleAnnouncement(req.params.id, isActive);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Wallet Routes
  app.get("/api/wallet/transactions", requireAuth, async (req: Request, res: Response) => {
    try {
      const transactions = await storage.getUserWallet(req.user!.id);
      res.json(transactions);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/wallet/pricing", async (req: Request, res: Response) => {
    try {
      const creditPrice = await storage.getSetting("credit_price");
      res.json({ 
        creditPrice: creditPrice ? parseFloat(creditPrice.value) : 1 
      });
    } catch (error: any) {
      res.json({ creditPrice: 1 });
    }
  });

  app.post("/api/wallet/verify-payment", requireAuth, async (req: Request, res: Response) => {
    try {
      const { reference } = req.body;
      const user = req.user!;

      // Verify with Paystack
      const response = await axios.get(`https://api.paystack.co/transaction/verify/${reference}`, {
        headers: { Authorization: `Bearer ${process.env.PAYSTACK_KEY}` },
      });

      if (response.data.status && response.data.data.status === "success") {
        const amount = Math.floor(response.data.data.amount / 100); // Convert from kobo
        const creditPrice = await storage.getSetting("credit_price");
        const pricePerCredit = creditPrice ? parseFloat(creditPrice.value) : 1;
        const credits = Math.floor(amount / pricePerCredit);

        // Update user credits
        await storage.updateUser(user.id, {
          credits: user.credits + credits,
        });

        // Create transaction record
        await storage.createWalletTransaction({
          userId: user.id,
          type: "purchase",
          amount: credits,
          description: `Paystack purchase (Ref: ${reference})`,
          status: "completed",
          transactionId: reference,
        });

        res.json({ success: true, creditsAdded: credits });
      } else {
        res.status(400).json({ message: "Payment not successful" });
      }
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/wallet/claim-giftcode", requireAuth, async (req: Request, res: Response) => {
    try {
      const { code } = req.body;
      const result = await storage.claimGiftCode(code, req.user!.id);

      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json({ message: "Invalid, expired, or exhausted gift code" });
      }
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Admin Wallet Routes
  app.get("/api/admin/wallet/stats", requireAdmin, async (req: Request, res: Response) => {
    try {
      const stats = await storage.getWalletStats();
      const pricing = await storage.getSetting("credit_price");
      res.json({
        ...stats,
        creditPrice: pricing ? parseFloat(pricing.value) : 1,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/admin/wallet/pricing", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { creditPrice } = req.body;
      await storage.setSetting({ key: "credit_price", value: creditPrice.toString() });
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Gift Code Routes
  app.get("/api/admin/giftcodes", requireAdmin, async (req: Request, res: Response) => {
    try {
      const giftcodes = await storage.getAllGiftCodes();
      res.json(giftcodes);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/admin/giftcodes", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { code, creditsAmount, maxClaims, expiryDate } = req.body;
      const giftcode = await storage.createGiftCode({
        code: code.toUpperCase(),
        creditsAmount,
        maxClaims,
        expiryDate: new Date(expiryDate),
        isActive: true,
      });
      res.json(giftcode);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/admin/giftcodes/:id/toggle", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { isActive } = req.body;
      await storage.updateGiftCode(req.params.id, { isActive });
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/admin/giftcodes/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      await storage.deleteGiftCode(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Create HTTP server
  const httpServer = createServer(app);

  return httpServer;
}
