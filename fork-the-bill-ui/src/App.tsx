import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ReceiptUpload from './components/ReceiptUpload';
import ExpenseView from './components/ExpenseView';
import { mockExpense } from './data/mockData';
import { Expense, Item } from './types';

function App() {
  const [currentExpense, setCurrentExpense] = useState<Expense | null>(null);

  const handleExpenseCreated = (expenseId: string) => {
    // In real app, this would fetch the expense from the API
    setCurrentExpense(mockExpense);
  };

  const handleItemClaimed = (itemId: string, personName: string) => {
    if (!currentExpense) return;

    // Mock item claiming - in real app, this would call the API
    const updatedExpense = {
      ...currentExpense,
      items: currentExpense.items.map(item =>
        item.id === itemId
          ? { ...item, claimedBy: [...item.claimedBy, personName] }
          : item
      )
    };

    // Recalculate amounts with tax and tip splitting
    const updatedPeople = recalculateSplits(updatedExpense);
    setCurrentExpense({
      ...updatedExpense,
      people: updatedPeople
    });
  };

  const handleItemsUpdated = (updatedItems: Item[]) => {
    if (!currentExpense) return;

    // Mock items update - in real app, this would call the API
    const updatedExpense = {
      ...currentExpense,
      items: updatedItems,
      subtotal: updatedItems.reduce((sum, item) => sum + item.price, 0)
    };

    // Recalculate amounts for all people
    const updatedPeople = recalculateSplits(updatedExpense);
    setCurrentExpense({
      ...updatedExpense,
      people: updatedPeople
    });
  };

  const handleTaxTipUpdated = (tax: number, tip: number) => {
    if (!currentExpense) return;

    // Mock tax/tip update - in real app, this would call the API
    const updatedExpense = {
      ...currentExpense,
      tax,
      tip,
      totalAmount: currentExpense.subtotal + tax + tip
    };

    // Recalculate amounts for all people
    const updatedPeople = recalculateSplits(updatedExpense);
    setCurrentExpense({
      ...updatedExpense,
      people: updatedPeople
    });
  };

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

  return (
    <Router>
      <div className="min-h-screen bg-gray-100 py-8">
        <Routes>
          <Route 
            path="/" 
            element={
              currentExpense ? (
                <Navigate to={`/expense/${currentExpense.id}`} replace />
              ) : (
                <ReceiptUpload onExpenseCreated={handleExpenseCreated} />
              )
            } 
          />
          <Route 
            path="/expense/:id" 
            element={
              currentExpense ? (
                <ExpenseView 
                  expense={currentExpense} 
                  onItemClaimed={handleItemClaimed}
                  onItemsUpdated={handleItemsUpdated}
                  onTaxTipUpdated={handleTaxTipUpdated}
                />
              ) : (
                <div className="text-center">
                  <p>Loading expense...</p>
                </div>
              )
            } 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
