import { Expense, Item } from '../types';
import { getMockExpenses, setMockExpenses } from './mockData';

// Helper function to recalculate splits (same logic as in App.tsx)
const recalculateSplits = (expense: Expense) => {
  const subtotal = expense.items.reduce((sum, item) => sum + item.price, 0);
  
  return expense.people.map(person => {
    // Calculate person's subtotal from claimed items
    const claimedItems = expense.items.filter(item =>
      item.claimedBy.includes(person.name)
    );
    const personSubtotal = claimedItems.reduce((sum, item) => {
      return sum + (item.price / item.claimedBy.length);
    }, 0);

    // Calculate percentage of total (for tax and tip splitting)
    const percentage = subtotal > 0 ? personSubtotal / subtotal : 0;
    
    // Calculate tax and tip shares based on percentage
    const taxShare = expense.tax * percentage;
    const tipShare = expense.tip * percentage;
    
    // Calculate total owed
    const totalOwed = personSubtotal + taxShare + tipShare;

    return {
      ...person,
      subtotal: personSubtotal,
      taxShare,
      tipShare,
      totalOwed,
      amountOwed: personSubtotal // Keep for backward compatibility
    };
  });
};

// API Service Functions with Mock Implementations

export const getExpense = async (id: string): Promise<Expense> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  const expenses = getMockExpenses();
  const expense = expenses.find(e => e.id === id);
  
  if (!expense) {
    throw new Error('Expense not found');
  }
  
  return expense;
};

export const createExpense = async (expenseData: Partial<Expense>): Promise<Expense> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const newExpense: Expense = {
    id: `exp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date().toISOString(),
    payerName: expenseData.payerName || 'Unknown',
    totalAmount: expenseData.totalAmount || 0,
    subtotal: expenseData.subtotal || 0,
    tax: expenseData.tax || 0,
    tip: expenseData.tip || 0,
    items: expenseData.items || [],
    people: expenseData.people || []
  };
  
  const expenses = getMockExpenses();
  expenses.push(newExpense);
  setMockExpenses(expenses);
  
  return newExpense;
};

export const updateExpense = async (id: string, updates: Partial<Expense>): Promise<Expense> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 400));
  
  const expenses = getMockExpenses();
  const index = expenses.findIndex(e => e.id === id);
  
  if (index === -1) {
    throw new Error('Expense not found');
  }
  
  // Update the expense
  const updatedExpense = { ...expenses[index], ...updates };
  
  // Recalculate splits if items, tax, or tip changed
  if (updates.items || updates.tax !== undefined || updates.tip !== undefined) {
    updatedExpense.people = recalculateSplits(updatedExpense);
  }
  
  expenses[index] = updatedExpense;
  setMockExpenses(expenses);
  
  return updatedExpense;
};

export const updateExpenseItems = async (id: string, items: Item[]): Promise<Expense> => {
  return updateExpense(id, { items });
};

export const updateExpenseTaxTip = async (id: string, tax: number, tip: number): Promise<Expense> => {
  return updateExpense(id, { tax, tip });
};

export const claimItem = async (expenseId: string, itemId: string, personName: string): Promise<Expense> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 200));
  
  const expenses = getMockExpenses();
  const expenseIndex = expenses.findIndex(e => e.id === expenseId);
  
  if (expenseIndex === -1) {
    throw new Error('Expense not found');
  }
  
  const expense = expenses[expenseIndex];
  const updatedItems = expense.items.map(item =>
    item.id === itemId
      ? { ...item, claimedBy: [...item.claimedBy, personName] }
      : item
  );
  
  const updatedExpense = {
    ...expense,
    items: updatedItems
  };
  
  // Recalculate splits
  updatedExpense.people = recalculateSplits(updatedExpense);
  
  expenses[expenseIndex] = updatedExpense;
  setMockExpenses(expenses);
  
  return updatedExpense;
};

export const unclaimItem = async (expenseId: string, itemId: string, personName: string): Promise<Expense> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 200));
  
  const expenses = getMockExpenses();
  const expenseIndex = expenses.findIndex(e => e.id === expenseId);
  
  if (expenseIndex === -1) {
    throw new Error('Expense not found');
  }
  
  const expense = expenses[expenseIndex];
  const updatedItems = expense.items.map(item =>
    item.id === itemId
      ? { ...item, claimedBy: item.claimedBy.filter(name => name !== personName) }
      : item
  );
  
  const updatedExpense = {
    ...expense,
    items: updatedItems
  };
  
  // Recalculate splits
  updatedExpense.people = recalculateSplits(updatedExpense);
  
  expenses[expenseIndex] = updatedExpense;
  setMockExpenses(expenses);
  
  return updatedExpense;
};

export const getAllExpenses = async (): Promise<Expense[]> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 200));
  
  return getMockExpenses();
};

export const deleteExpense = async (id: string): Promise<void> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  const expenses = getMockExpenses();
  const filteredExpenses = expenses.filter(e => e.id !== id);
  
  if (filteredExpenses.length === expenses.length) {
    throw new Error('Expense not found');
  }
  
  setMockExpenses(filteredExpenses);
}; 