import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean, unique } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email"),
  credits: integer("credits").notNull().default(100),
  referralCode: text("referral_code").notNull().unique(),
  referredBy: text("referred_by"),
  successfulReferrals: integer("successful_referrals").notNull().default(0),
  isBanned: boolean("is_banned").notNull().default(false),
  isAdmin: boolean("is_admin").notNull().default(false),
  ipAddress: text("ip_address").notNull(),
  lastLoginDate: timestamp("last_login_date"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Countries table
export const countries = pgTable("countries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  code: text("code").notNull(),
  flagUrl: text("flag_url"),
  totalNumbers: integer("total_numbers").notNull().default(0),
  usedNumbers: integer("used_numbers").notNull().default(0),
  numbersFile: text("numbers_file").notNull(), // Stored as newline-separated numbers
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// User number history
export const numberHistory = pgTable("number_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  countryId: text("country_id").notNull().references(() => countries.id, { onDelete: "cascade" }),
  phoneNumber: text("phone_number").notNull(),
  usedAt: timestamp("used_at").notNull().defaultNow(),
});

// SMS messages
export const smsMessages = pgTable("sms_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  phoneNumber: text("phone_number").notNull(),
  sender: text("sender").notNull(),
  message: text("message").notNull(),
  receivedAt: timestamp("received_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Announcements
export const announcements = pgTable("announcements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  content: text("content").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Notifications
export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").notNull().default(false),
  isBroadcast: boolean("is_broadcast").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Wallet transactions
export const walletTransactions = pgTable("wallet_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // 'purchase', 'referral', 'admin', 'usage', 'giftcode'
  amount: integer("amount").notNull(),
  description: text("description").notNull(),
  status: text("status").notNull().default("completed"), // 'pending', 'completed', 'failed'
  transactionId: text("transaction_id"), // For payment processing
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Gift codes
export const giftCodes = pgTable("gift_codes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  code: text("code").notNull().unique(),
  creditsAmount: integer("credits_amount").notNull(),
  maxClaims: integer("max_claims").notNull(),
  claimedCount: integer("claimed_count").notNull().default(0),
  expiryDate: timestamp("expiry_date").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// System settings
export const settings = pgTable("settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  numberHistory: many(numberHistory),
  notifications: many(notifications),
  walletTransactions: many(walletTransactions),
}));

export const countriesRelations = relations(countries, ({ many }) => ({
  numberHistory: many(numberHistory),
}));

export const numberHistoryRelations = relations(numberHistory, ({ one }) => ({
  user: one(users, {
    fields: [numberHistory.userId],
    references: [users.id],
  }),
  country: one(countries, {
    fields: [numberHistory.countryId],
    references: [countries.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

export const walletTransactionsRelations = relations(walletTransactions, ({ one }) => ({
  user: one(users, {
    fields: [walletTransactions.userId],
    references: [users.id],
  }),
}));

export const giftCodesRelations = relations(giftCodes, ({ many }) => ({
  claims: many(walletTransactions),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  credits: true,
  referralCode: true,
  successfulReferrals: true,
  isBanned: true,
  isAdmin: true,
  lastLoginDate: true,
  createdAt: true,
});

export const insertCountrySchema = createInsertSchema(countries).omit({
  id: true,
  usedNumbers: true,
  createdAt: true,
});

export const insertNumberHistorySchema = createInsertSchema(numberHistory).omit({
  id: true,
  usedAt: true,
});

export const insertSmsMessageSchema = createInsertSchema(smsMessages).omit({
  id: true,
  createdAt: true,
});

export const insertAnnouncementSchema = createInsertSchema(announcements).omit({
  id: true,
  createdAt: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

export const insertSettingSchema = createInsertSchema(settings).omit({
  id: true,
});

export const insertWalletTransactionSchema = createInsertSchema(walletTransactions).omit({
  id: true,
  createdAt: true,
});

export const insertGiftCodeSchema = createInsertSchema(giftCodes).omit({
  id: true,
  claimedCount: true,
  createdAt: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type WalletTransaction = typeof walletTransactions.$inferSelect;
export type InsertWalletTransaction = z.infer<typeof insertWalletTransactionSchema>;
export type GiftCode = typeof giftCodes.$inferSelect;
export type InsertGiftCode = z.infer<typeof insertGiftCodeSchema>;

export type InsertCountry = z.infer<typeof insertCountrySchema>;
export type Country = typeof countries.$inferSelect;

export type InsertNumberHistory = z.infer<typeof insertNumberHistorySchema>;
export type NumberHistory = typeof numberHistory.$inferSelect;

export type InsertSmsMessage = z.infer<typeof insertSmsMessageSchema>;
export type SmsMessage = typeof smsMessages.$inferSelect;

export type InsertAnnouncement = z.infer<typeof insertAnnouncementSchema>;
export type Announcement = typeof announcements.$inferSelect;

export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;

export type InsertSetting = z.infer<typeof insertSettingSchema>;
export type Setting = typeof settings.$inferSelect;

// Login schema
export const loginSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export type LoginInput = z.infer<typeof loginSchema>;

// Signup schema
export const signupSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  email: z.string().email("Invalid email address").optional(),
  referralCode: z.string().optional(),
});

export type SignupInput = z.infer<typeof signupSchema>;
