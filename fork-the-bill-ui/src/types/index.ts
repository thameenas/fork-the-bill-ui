export interface Item {
  id: string;
  name: string;
  price: number;
  claimedBy: string[];
}

export interface Person {
  name: string;
  itemsClaimed: string[];
  amountOwed: number;
  subtotal: number;
  taxShare: number;
  tipShare: number;
  totalOwed: number;
  isFinished: boolean;
}

export interface Expense {
  id: string;
  slug?: string;
  createdAt: string;
  payerName: string;
  totalAmount: number;
  subtotal: number;
  tax: number;
  tip: number;
  items: Item[];
  people: Person[];
}

export interface ExpenseSummary {
  expense: Expense;
  splitSummary: {
    [personName: string]: number;
  };
} 