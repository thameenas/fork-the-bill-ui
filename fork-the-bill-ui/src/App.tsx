import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ExpensePage from './components/ExpensePage';
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
          element={<ExpensePage />}
        />
      </Routes>
    </Router>
  );
}

export default App;
