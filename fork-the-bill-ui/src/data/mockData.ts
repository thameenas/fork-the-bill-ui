import { Expense } from '../types';

export const mockExpense: Expense = {
  id: 'exp-123',
  createdAt: '2024-01-15T18:30:00Z',
  payerName: 'Alice',
  totalAmount: 85.50,
  items: [
    {
      id: 'item-1',
      name: 'Margherita Pizza',
      price: 18.00,
      claimedBy: ['Alice']
    },
    {
      id: 'item-2',
      name: 'Caesar Salad',
      price: 12.50,
      claimedBy: ['Bob']
    },
    {
      id: 'item-3',
      name: 'Pasta Carbonara',
      price: 16.00,
      claimedBy: ['Charlie']
    },
    {
      id: 'item-4',
      name: 'Garlic Bread',
      price: 6.00,
      claimedBy: ['Alice', 'Bob']
    },
    {
      id: 'item-5',
      name: 'Tiramisu',
      price: 8.00,
      claimedBy: ['Charlie', 'David']
    },
    {
      id: 'item-6',
      name: 'Soft Drinks',
      price: 15.00,
      claimedBy: ['Alice', 'Bob', 'Charlie', 'David']
    }
  ],
  people: [
    { name: 'Alice', itemsClaimed: ['item-1', 'item-4'], amountOwed: 24.00 },
    { name: 'Bob', itemsClaimed: ['item-2', 'item-4'], amountOwed: 18.50 },
    { name: 'Charlie', itemsClaimed: ['item-3', 'item-5'], amountOwed: 24.00 },
    { name: 'David', itemsClaimed: ['item-5'], amountOwed: 19.00 }
  ]
}; 