import { 
  users, 
  countries, 
  numberHistory, 
  smsMessages, 
  announcements,
  notifications,
  settings,
  walletTransactions,
  giftCodes,
  type User, 
  type InsertUser,
  type Country,
  type InsertCountry,
  type NumberHistory,
  type InsertNumberHistory,
  type SmsMessage,
  type InsertSmsMessage,
  type Announcement,
  type InsertAnnouncement,
  type Notification,
  type InsertNotification,
  type Setting,
  type InsertSetting,
  type WalletTransaction,
  type InsertWalletTransaction,
  type GiftCode,
  type InsertGiftCode,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByIP(ipAddress: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, data: Partial<User>): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  
  // Country methods
  getCountries(): Promise<Country[]>;
  getCountry(id: string): Promise<Country | undefined>;
  createCountry(country: InsertCountry): Promise<Country>;
  deleteCountry(id: string): Promise<void>;
  updateCountry(id: string, data: Partial<Country>): Promise<Country | undefined>;
  
  // Number history methods
  getUserHistory(userId: string): Promise<NumberHistory[]>;
  createNumberHistory(history: InsertNumberHistory): Promise<NumberHistory>;
  
  // SMS methods
  getSmsMessages(phoneNumber: string): Promise<SmsMessage[]>;
  createSmsMessage(sms: InsertSmsMessage): Promise<SmsMessage>;
  
  // Announcement methods
  getAnnouncements(): Promise<Announcement[]>;
  createAnnouncement(announcement: InsertAnnouncement): Promise<Announcement>;
  updateAnnouncement(id: string, content: string): Promise<Announcement | undefined>;
  deleteAnnouncement(id: string): Promise<void>;
  toggleAnnouncement(id: string, isActive: boolean): Promise<void>;
  
  // Notification methods
  getUserNotifications(userId: string): Promise<Notification[]>;
  getAllNotifications(): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationRead(id: string): Promise<void>;
  
  // Settings methods
  getSetting(key: string): Promise<Setting | undefined>;
  setSetting(setting: InsertSetting): Promise<Setting>;
  
  // Wallet methods
  getUserWallet(userId: string): Promise<WalletTransaction[]>;
  createWalletTransaction(transaction: InsertWalletTransaction): Promise<WalletTransaction>;
  getWalletStats(): Promise<{ totalTransactions: number; totalPurchased: number }>;
  
  // Gift code methods
  getGiftCode(code: string): Promise<GiftCode | undefined>;
  getAllGiftCodes(): Promise<GiftCode[]>;
  createGiftCode(giftCode: InsertGiftCode): Promise<GiftCode>;
  updateGiftCode(id: string, data: Partial<GiftCode>): Promise<GiftCode | undefined>;
  deleteGiftCode(id: string): Promise<void>;
  claimGiftCode(code: string, userId: string): Promise<{ success: boolean; creditsAdded: number }>;
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByIP(ipAddress: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.ipAddress, ipAddress));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: string, data: Partial<User>): Promise<User | undefined> {
    const [user] = await db.update(users).set(data).where(eq(users.id, id)).returning();
    return user || undefined;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  // Country methods
  async getCountries(): Promise<Country[]> {
    return await db.select().from(countries).orderBy(desc(countries.createdAt));
  }

  async getCountry(id: string): Promise<Country | undefined> {
    const [country] = await db.select().from(countries).where(eq(countries.id, id));
    return country || undefined;
  }

  async createCountry(insertCountry: InsertCountry): Promise<Country> {
    const [country] = await db.insert(countries).values(insertCountry).returning();
    return country;
  }

  async deleteCountry(id: string): Promise<void> {
    await db.delete(countries).where(eq(countries.id, id));
  }

  async updateCountry(id: string, data: Partial<Country>): Promise<Country | undefined> {
    const [country] = await db.update(countries).set(data).where(eq(countries.id, id)).returning();
    return country || undefined;
  }

  // Number history methods
  async getUserHistory(userId: string): Promise<NumberHistory[]> {
    return await db.select().from(numberHistory).where(eq(numberHistory.userId, userId)).orderBy(desc(numberHistory.usedAt));
  }

  async createNumberHistory(insertHistory: InsertNumberHistory): Promise<NumberHistory> {
    const [history] = await db.insert(numberHistory).values(insertHistory).returning();
    return history;
  }

  // SMS methods
  async getSmsMessages(phoneNumber: string): Promise<SmsMessage[]> {
    return await db.select().from(smsMessages).where(eq(smsMessages.phoneNumber, phoneNumber)).orderBy(desc(smsMessages.receivedAt));
  }

  async createSmsMessage(insertSms: InsertSmsMessage): Promise<SmsMessage> {
    const [sms] = await db.insert(smsMessages).values(insertSms).returning();
    return sms;
  }

  // Announcement methods
  async getAnnouncements(): Promise<Announcement[]> {
    return await db.select().from(announcements).orderBy(desc(announcements.createdAt));
  }

  async createAnnouncement(insertAnnouncement: InsertAnnouncement): Promise<Announcement> {
    const [announcement] = await db.insert(announcements).values(insertAnnouncement).returning();
    return announcement;
  }

  async updateAnnouncement(id: string, content: string): Promise<Announcement | undefined> {
    const [announcement] = await db.update(announcements).set({ content }).where(eq(announcements.id, id)).returning();
    return announcement || undefined;
  }

  async deleteAnnouncement(id: string): Promise<void> {
    await db.delete(announcements).where(eq(announcements.id, id));
  }

  async toggleAnnouncement(id: string, isActive: boolean): Promise<void> {
    await db.update(announcements).set({ isActive }).where(eq(announcements.id, id));
  }

  // Notification methods
  async getUserNotifications(userId: string): Promise<Notification[]> {
    return await db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt));
  }

  async getAllNotifications(): Promise<Notification[]> {
    return await db.select().from(notifications).where(eq(notifications.isBroadcast, true)).orderBy(desc(notifications.createdAt));
  }

  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    const [notification] = await db.insert(notifications).values(insertNotification).returning();
    return notification;
  }

  async markNotificationRead(id: string): Promise<void> {
    await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, id));
  }

  // Settings methods
  async getSetting(key: string): Promise<Setting | undefined> {
    const [setting] = await db.select().from(settings).where(eq(settings.key, key));
    return setting || undefined;
  }

  async setSetting(insertSetting: InsertSetting): Promise<Setting> {
    const existing = await this.getSetting(insertSetting.key);
    if (existing) {
      const [setting] = await db.update(settings)
        .set({ value: insertSetting.value })
        .where(eq(settings.key, insertSetting.key))
        .returning();
      return setting;
    } else {
      const [setting] = await db.insert(settings).values(insertSetting).returning();
      return setting;
    }
  }

  // Wallet methods
  async getUserWallet(userId: string): Promise<WalletTransaction[]> {
    return await db.select().from(walletTransactions).where(eq(walletTransactions.userId, userId)).orderBy(desc(walletTransactions.createdAt));
  }

  async createWalletTransaction(transaction: InsertWalletTransaction): Promise<WalletTransaction> {
    const [result] = await db.insert(walletTransactions).values(transaction).returning();
    return result;
  }

  async getWalletStats(): Promise<{ totalTransactions: number; totalPurchased: number }> {
    const transactions = await db.select().from(walletTransactions);
    const purchases = transactions.filter(t => t.type === 'purchase' && t.status === 'completed');
    return {
      totalTransactions: transactions.length,
      totalPurchased: purchases.reduce((sum, t) => sum + t.amount, 0),
    };
  }

  // Gift code methods
  async getGiftCode(code: string): Promise<GiftCode | undefined> {
    const [gift] = await db.select().from(giftCodes).where(eq(giftCodes.code, code));
    return gift || undefined;
  }

  async getAllGiftCodes(): Promise<GiftCode[]> {
    return await db.select().from(giftCodes).orderBy(desc(giftCodes.createdAt));
  }

  async createGiftCode(giftCode: InsertGiftCode): Promise<GiftCode> {
    const [result] = await db.insert(giftCodes).values(giftCode).returning();
    return result;
  }

  async updateGiftCode(id: string, data: Partial<GiftCode>): Promise<GiftCode | undefined> {
    const [result] = await db.update(giftCodes).set(data).where(eq(giftCodes.id, id)).returning();
    return result || undefined;
  }

  async deleteGiftCode(id: string): Promise<void> {
    await db.delete(giftCodes).where(eq(giftCodes.id, id));
  }

  async claimGiftCode(code: string, userId: string): Promise<{ success: boolean; creditsAdded: number }> {
    const gift = await this.getGiftCode(code);
    if (!gift) return { success: false, creditsAdded: 0 };
    if (!gift.isActive) return { success: false, creditsAdded: 0 };
    if (gift.claimedCount >= gift.maxClaims) return { success: false, creditsAdded: 0 };
    if (new Date(gift.expiryDate) < new Date()) return { success: false, creditsAdded: 0 };

    const user = await this.getUser(userId);
    if (!user) return { success: false, creditsAdded: 0 };

    // Update user credits
    await this.updateUser(userId, { credits: user.credits + gift.creditsAmount });

    // Update gift code claim count
    await this.updateGiftCode(gift.id, { claimedCount: gift.claimedCount + 1 });

    // Create transaction record
    await this.createWalletTransaction({
      userId,
      type: 'giftcode',
      amount: gift.creditsAmount,
      description: `Gift code claimed: ${code}`,
      status: 'completed',
    });

    return { success: true, creditsAdded: gift.creditsAmount };
  }
}

export const storage = new DatabaseStorage();
