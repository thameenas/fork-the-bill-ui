// Backend API Response Types (matching the API schema)
export interface ItemResponse {
  id: string;
  name: string;
  price: number;
  quantity: number;
  totalQuantity: number;
  claimedBy: string[]; // Array of person IDs
}

export interface PersonResponse {
  id: string;
  name: string;
  itemsClaimed: string[]; // Array of item IDs
  amountOwed: number;
  subtotal: number;
  taxShare: number;
  serviceChargeShare: number;
  discountShare: number;
  totalOwed: number;
  finished: boolean; // API uses 'finished' instead of 'isFinished'
}

export interface ExpenseResponse {
  id: string;
  slug: string;
  restaurantName: string;
  createdAt: string;
  payerName: string;
  totalAmount: number;
  subtotal: number;
  tax: number;
  serviceCharge: number;
  discount: number;
  items: ItemResponse[];
  people: PersonResponse[];
}

// Backend API Request Types
export interface ItemRequest {
  id?: string;
  name: string;
  price: number;
}

export interface PersonRequest {
  name: string;
  itemsClaimed?: string[];
  amountOwed?: number;
  subtotal?: number;
  taxShare?: number;
  serviceChargeShare?: number;
  discountShare?: number;
  totalOwed?: number;
  isFinished?: boolean;
}

export interface ExpenseRequest {
  payerName: string;
  totalAmount: number;
  subtotal: number;
  tax: number;
  serviceCharge: number;
  discount: number;
  items: ItemRequest[];
  people?: PersonRequest[];
}

export interface ClaimItemRequest {
  personId: string;
}

// Frontend Types (for backward compatibility and easier frontend usage)
export interface Item {
  id: string;
  name: string;
  price: number;
  quantity: number;
  totalQuantity: number;
  claimedBy: string[]; // Array of person names (for frontend display)
}

export interface Person {
  id?: string;
  name: string;
  itemsClaimed: string[]; // Array of item IDs
  amountOwed: number;
  subtotal: number;
  taxShare: number;
  serviceChargeShare: number;
  discountShare: number;
  totalOwed: number;
  isFinished: boolean;
}

export interface Expense {
  id: string;
  slug?: string;
  restaurantName: string;
  createdAt: string;
  payerName: string;
  totalAmount: number;
  subtotal: number;
  tax: number;
  serviceCharge: number;
  discount: number;
  items: Item[];
  people: Person[];
}

export interface ExpenseSummary {
  expense: Expense;
  splitSummary: {
    [personName: string]: number;
  };
}

// API Error Type
export interface ApiError {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  path: string;
}

// Helper types for API conversion
export interface PersonNameToIdMap {
  [personName: string]: string;
}

export interface ItemNameToIdMap {
  [itemName: string]: string;
} 