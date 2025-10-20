import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Expense, Item } from '../types';
import ExpenseView from './ExpenseView';
import { getExpense, updateExpenseItems, updateExpenseTaxTip, updatePersonCompletionStatus } from '../api/client';

const ExpensePage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [expense, setExpense] = useState<Expense | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadExpense = async () => {
      if (!slug) return;
      
      try {
        setLoading(true);
        setError(null);
        const loadedExpense = await getExpense(slug);
        setExpense(loadedExpense);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load expense');
      } finally {
        setLoading(false);
      }
    };

    loadExpense();
  }, [slug]);

  const handleItemClaimed = async (itemId: string, personName: string) => {
    console.log('🎯 App: Item claimed callback received:', itemId, personName);
    
    if (!expense || !expense.slug) {
      console.log('❌ App: No expense available or missing slug');
      return;
    }

    try {
      console.log('🎯 App: Refreshing expense data after item claim...');
      const updatedExpense = await getExpense(expense.slug);
      setExpense(updatedExpense);
    } catch (err) {
      console.error('❌ App: Error refreshing expense after claim:', err);
    }
  };

  const handleItemsUpdated = async (updatedItems: Item[]) => {
    if (!expense || !expense.slug) return;

    try {
      const updatedExpense = await updateExpenseItems(expense.slug, updatedItems);
      setExpense(updatedExpense);
    } catch (err) {
      console.error('Failed to update items:', err);
    }
  };

  const handleTaxTipUpdated = async (tax: number, tip: number) => {
    if (!expense || !expense.slug) return;

    try {
      const updatedExpense = await updateExpenseTaxTip(expense.slug, tax, tip);
      setExpense(updatedExpense);
    } catch (err) {
      console.error('Failed to update tax/tip:', err);
    }
  };

  // Handle completion status update
  const handleCompletionStatusUpdated = async (personName: string, isFinished: boolean) => {
    console.log('🎯 App: handleCompletionStatusUpdated called with:', personName, isFinished);
    
    if (!expense || !expense.slug) {
      console.log('❌ App: No expense available or missing slug');
      return;
    }

    try {
      console.log('🎯 App: Calling updatePersonCompletionStatus API...');
      const updatedExpense = await updatePersonCompletionStatus(expense.slug, personName, isFinished);
      console.log('🎯 App: API call successful, updating expense state');
      setExpense(updatedExpense);
    } catch (err) {
      console.error('❌ App: Error updating completion status:', err);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 py-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading expense...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 py-8 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error: {error}</p>
          <button
            onClick={() => window.location.href = '/'}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  if (!expense) {
    return (
      <div className="min-h-screen bg-gray-100 py-8 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Expense not found</p>
          <button
            onClick={() => window.location.href = '/'}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <ExpenseView
        expense={expense}
        onItemClaimed={handleItemClaimed}
        onItemsUpdated={handleItemsUpdated}
        onTaxTipUpdated={handleTaxTipUpdated}
        onCompletionStatusUpdated={handleCompletionStatusUpdated}
      />
    </div>
  );
};

export default ExpensePage;
