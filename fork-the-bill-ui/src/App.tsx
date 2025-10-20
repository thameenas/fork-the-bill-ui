import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import ExpenseView from './components/ExpenseView';
import CreateExpensePage from './components/CreateExpensePage';

function App() {
  return (
    <HelmetProvider>
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
    </HelmetProvider>
  );
}

export default App;
