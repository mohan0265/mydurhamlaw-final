// Admin Dashboard Type Definitions

export type SubscriptionStatus = 'trial' | 'active' | 'inactive' | 'cancelled';

export type TestAccount = {
  userId: string;
  email: string;
  displayName: string;
  role: 'student' | 'loved_one';
  yearGroup?: string;
  isTestAccount: boolean;
  subscriptionStatus: SubscriptionStatus;
  subscriptionEndsAt?: string;
  trialEndsAt?: string;
  createdAt: string;
};

export type AWYConnection = {
  id: string;
  studentUserId: string;
  studentEmail: string;
  lovedUserId: string;
  lovedEmail: string;
  relationship: string;
  nickname?: string;
  status: 'active' | 'granted' | 'pending' | 'revoked';
  createdAt: string;
};

export type CreateTestStudentRequest = {
  email: string;
  displayName: string;
  yearGroup: 'foundation' | 'year1' | 'year2' | 'year3';
  password?: string;
  isTest?: boolean;
};

export type CreateTestStudentResponse = {
  userId: string;
  profileId: string;
  email: string;
  trialEndsAt: string;
};

export type CreateTestLovedOneRequest = {
  email: string;
  displayName: string;
  studentUserId: string;
  relationship: 'parent' | 'guardian' | 'sibling' | 'partner' | 'friend';
  nickname?: string;
  password?: string;
  isTest?: boolean;
};

export type CreateTestLovedOneResponse = {
  userId: string;
  profileId: string;
  connectionId: string;
  status: string;
  email: string;  // The login email (may be auto-generated for non-email IDs)
};
