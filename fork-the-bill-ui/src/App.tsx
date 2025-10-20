import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ExpenseView from './components/ExpenseView';
import CreateExpensePage from './components/CreateExpensePage';

function App() {
  return (
    <Router>
      <Routes>
        <Route 
          path="/" 
          element={<CreateExpensePage />}
        />
        <Route 
          path=":slug" 
          element={<ExpenseView />}
        />
      </Routes>
    </Router>
  );
}

export default App;