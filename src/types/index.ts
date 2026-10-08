export type Role = "ADMIN" | "MODERATOR";
export type UserStatus = "ACTIVE" | "INACTIVE";
export type CollectionMethod = "CASH" | "BKASH" | "NAGAD" | "BANK" | "OTHER";
export type DonationStatus = "CONFIRMED" | "CANCELLED";
export type CampaignStatus = "DRAFT" | "ACTIVE" | "COMPLETED" | "CLOSED";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pages: number;
  limit: number;
}

export interface DonationRow {
  id: string;
  donorName: string;
  donorMobile: string;
  amount: number;
  collectionMethod: CollectionMethod;
  transactionId?: string;
  moderator: { id: string; name: string } | null;
  donationDate: string;
  status: DonationStatus;
  note?: string;
  source: "PUBLIC" | "MODERATOR";
  anonymous: boolean;
  cancelReason?: string;
}

export interface CampaignDTO {
  id: string;
  title: string;
  description: string;
  targetAmount: number;
  status: CampaignStatus;
  startDate?: string;
  endDate?: string;
}

export interface Stats {
  total: number;
  count: number;
  donors: number;
}

export interface CampaignSummary extends Stats {
  target: number;
  remaining: number;
  percent: number;
  todayTotal: number;
  todayCount: number;
}

export interface PerformanceRow {
  id?: string; // only sent to admins
  rank: number;
  name: string;
  count: number;
  total: number;
  isMe: boolean;
}

export interface MethodRow {
  method: CollectionMethod;
  count: number;
  total: number;
}

export type RangeKey = "today" | "7d" | "month" | "custom" | "all";
