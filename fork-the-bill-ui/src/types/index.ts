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
}

export interface Expense {
  id: string;
  createdAt: string;
  payerName: string;
  totalAmount: number;
  items: Item[];
  people: Person[];
}

export interface ExpenseSummary {
  expense: Expense;
  splitSummary: {
    [personName: string]: number;
  };
} 