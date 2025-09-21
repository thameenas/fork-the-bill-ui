import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useParams, useNavigate } from 'react-router-dom';
import { Expense, Item } from './types';
import ExpenseView from './components/ExpenseView';
import ReceiptUpload from './components/ReceiptUpload';
import { getExpense, updateExpenseItems, updateExpenseTaxTip, claimItem, updatePersonCompletionStatus } from './api/client';

// Component to handle expense loading and display
const ExpensePage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [expense, setExpense] = useState<Expense | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load expense data
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

  // Handle item claiming
  const handleItemClaimed = async (itemId: string, personName: string) => {
    if (!expense) return;

    try {
      const updatedExpense = await claimItem(expense.id, itemId, personName);
      setExpense(updatedExpense);
    } catch (err) {
      console.error('Failed to claim item:', err);
      // Could show a toast notification here
    }
  };

  const handleItemsUpdated = async (updatedItems: Item[]) => {
    if (!expense) return;

    try {
      const updatedExpense = await updateExpenseItems(expense.id, updatedItems);
      setExpense(updatedExpense);
    } catch (err) {
      console.error('Failed to update items:', err);
    }
  };

  const handleTaxTipUpdated = async (tax: number, tip: number) => {
    if (!expense) return;

    try {
      const updatedExpense = await updateExpenseTaxTip(expense.id, tax, tip);
      setExpense(updatedExpense);
    } catch (err) {
      console.error('Failed to update tax/tip:', err);
    }
  };

  // Handle completion status update
  const handleCompletionStatusUpdated = async (personName: string, isFinished: boolean) => {
    console.log('🎯 App: handleCompletionStatusUpdated called with:', personName, isFinished);
    
    if (!expense) {
      console.log('❌ App: No expense available');
      return;
    }

    try {
      console.log('🎯 App: Calling updatePersonCompletionStatus API...');
      const updatedExpense = await updatePersonCompletionStatus(expense.id, personName, isFinished);
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

// Component to handle expense creation
const CreateExpensePage: React.FC = () => {
  const navigate = useNavigate();

  const handleExpenseCreated = async (slug: string) => {
    // Use React Router navigation instead of window.location.href
    navigate(`/${slug}`);
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <ReceiptUpload onExpenseCreated={handleExpenseCreated} />
    </div>
  );
};

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-100 py-8">
        <Routes>
          <Route 
            path="/" 
            element={<CreateExpensePage />}
          />
          <Route 
            path=":slug" 
            element={<ExpensePage />}
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
