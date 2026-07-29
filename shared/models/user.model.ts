export interface User {
  id: number;
  email: string;
  name: string;
  role: string;
  householdId: number | null; // Nullable if the user hasn't joined a household yet
  createdAt: Date;
  updatedAt: Date;
  isActive?: boolean;
  currency?: string;
  dateFormat?: string;
  avatar?: string | null;
}
