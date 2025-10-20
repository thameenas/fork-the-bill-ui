import React from 'react';
import { useNavigate } from 'react-router-dom';
import ReceiptUpload from './ReceiptUpload';

const CreateExpensePage: React.FC = () => {
  const navigate = useNavigate();

  const handleExpenseCreated = async (slug: string) => {
    navigate(`/${slug}`);
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <ReceiptUpload onExpenseCreated={handleExpenseCreated} />
    </div>
  );
};

export default CreateExpensePage;
