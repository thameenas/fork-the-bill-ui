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

    // Recalculate amounts (simplified - in real app, this would be done on the backend)
    const updatedPeople = updatedExpense.people.map(person => {
      const claimedItems = updatedExpense.items.filter(item =>
        item.claimedBy.includes(person.name)
      );
      const amountOwed = claimedItems.reduce((sum, item) => {
        return sum + (item.price / item.claimedBy.length);
      }, 0);
      return { ...person, amountOwed };
    });

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
      totalAmount: updatedItems.reduce((sum, item) => sum + item.price, 0)
    };

    // Recalculate amounts for all people
    const updatedPeople = updatedExpense.people.map(person => {
      const claimedItems = updatedItems.filter(item =>
        item.claimedBy.includes(person.name)
      );
      const amountOwed = claimedItems.reduce((sum, item) => {
        return sum + (item.price / item.claimedBy.length);
      }, 0);
      return { ...person, amountOwed };
    });

    setCurrentExpense({
      ...updatedExpense,
      people: updatedPeople
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
