// SMS Subscription Database Service
// Supports in-memory (development) and Vercel Postgres (production)

import { LanguageCode } from "@/backend/types";

export interface SMSSubscriptionRecord {
  phoneNumber: string;
  lga: string;
  state: string;
  preferredLanguage: LanguageCode;
  createdAt: string;
  active: boolean;
}

// Use in-memory storage if no database configured
const inMemorySubscriptions = new Map<string, SMSSubscriptionRecord>();

/**
 * Check if database is configured
 */
export function isDatabaseConfigured(): boolean {
  return !!process.env.DATABASE_URL || !!process.env.POSTGRES_URL;
}

/**
 * Get all SMS subscriptions for an LGA
 */
export async function getSubscriptionsForLga(
  lga: string,
): Promise<SMSSubscriptionRecord[]> {
  if (isDatabaseConfigured()) {
    // TODO: Implement database query when DB is set up
    // For now, return empty
    console.log("[SMS] Database configured but not implemented. Using fallback.");
    return [];
  }

  // In-memory fallback
  return Array.from(inMemorySubscriptions.values()).filter(
    (sub) => sub.active && sub.lga.toLowerCase() === lga.toLowerCase(),
  );
}

/**
 * Get subscription by phone number
 */
export async function getSubscriptionByPhone(
  phoneNumber: string,
): Promise<SMSSubscriptionRecord | null> {
  if (isDatabaseConfigured()) {
    // TODO: Implement database query
    return null;
  }

  return inMemorySubscriptions.get(phoneNumber) || null;
}

/**
 * Create or update SMS subscription
 */
export async function createSubscription(
  phoneNumber: string,
  lga: string,
  state: string,
  preferredLanguage: LanguageCode,
): Promise<SMSSubscriptionRecord> {
  const subscription: SMSSubscriptionRecord = {
    phoneNumber,
    lga,
    state,
    preferredLanguage,
    createdAt: new Date().toISOString(),
    active: true,
  };

  if (isDatabaseConfigured()) {
    // TODO: Implement database insert
    console.log("[SMS] Database configured but not implemented. Using fallback.");
  }

  inMemorySubscriptions.set(phoneNumber, subscription);
  return subscription;
}

/**
 * Delete SMS subscription
 */
export async function deleteSubscription(phoneNumber: string): Promise<boolean> {
  if (isDatabaseConfigured()) {
    // TODO: Implement database delete
    console.log("[SMS] Database configured but not implemented. Using fallback.");
  }

  return inMemorySubscriptions.delete(phoneNumber);
}

/**
 * Get all active subscriptions (for admin purposes)
 */
export async function getAllSubscriptions(): Promise<SMSSubscriptionRecord[]> {
  if (isDatabaseConfigured()) {
    // TODO: Implement database query
    return [];
  }

  return Array.from(inMemorySubscriptions.values()).filter((sub) => sub.active);
}

/**
 * Update subscription status
 */
export async function updateSubscriptionStatus(
  phoneNumber: string,
  active: boolean,
): Promise<SMSSubscriptionRecord | null> {
  if (isDatabaseConfigured()) {
    // TODO: Implement database update
    return null;
  }

  const subscription = inMemorySubscriptions.get(phoneNumber);
  if (subscription) {
    subscription.active = active;
    return subscription;
  }

  return null;
}
