import { CategoryType } from './category-type.enum';

export interface Category {
  id: number;
  name: string;
  householdId: number | null; // null represents global categories
  isGlobal: boolean;
  type: CategoryType;
  createdAt: Date;
  icon?: string | null;
}
