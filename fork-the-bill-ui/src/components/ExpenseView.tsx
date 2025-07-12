import React, { useState, useEffect } from 'react';
import { Expense, Item } from '../types';
import QRCode from 'react-qr-code';

interface ExpenseViewProps {
  expense: Expense;
  onItemClaimed: (itemId: string, personName: string) => void;
  onItemsUpdated?: (items: Item[]) => void;
}

const ExpenseView: React.FC<ExpenseViewProps> = ({ expense, onItemClaimed, onItemsUpdated }) => {
  const [selectedPerson, setSelectedPerson] = useState('');
  const [showQR, setShowQR] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingItems, setEditingItems] = useState<Item[]>(expense.items);
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [isClaiming, setIsClaiming] = useState<string | null>(null);
  const [realTimeUpdates, setRealTimeUpdates] = useState<Item[]>(expense.items);

  // Mock real-time updates - simulates other users claiming items
  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate random claims from other users
      const mockUsers = ['Alice', 'Bob', 'Charlie', 'David'];
      const randomUser = mockUsers[Math.floor(Math.random() * mockUsers.length)];
      const randomItem = editingItems[Math.floor(Math.random() * editingItems.length)];
      
      if (randomItem && !randomItem.claimedBy.includes(randomUser) && Math.random() < 0.1) {
        setRealTimeUpdates(prev => prev.map(item => 
          item.id === randomItem.id 
            ? { ...item, claimedBy: [...item.claimedBy, randomUser] }
            : item
        ));
      }
    }, 3000); // Update every 3 seconds

    return () => clearInterval(interval);
  }, [editingItems]);

  // Use real-time updates when not in edit mode
  const displayItems = isEditMode ? editingItems : realTimeUpdates;

  const handleClaimItem = async (itemId: string) => {
    if (!selectedPerson.trim()) return;
    
    setIsClaiming(itemId);
    
    // Mock API call delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Update both local state and real-time state
    const updatedItems = displayItems.map(item =>
      item.id === itemId
        ? { ...item, claimedBy: [...item.claimedBy, selectedPerson] }
        : item
    );
    
    setRealTimeUpdates(updatedItems);
    setEditingItems(updatedItems);
    onItemClaimed(itemId, selectedPerson);
    setIsClaiming(null);
  };

  const handleUnclaimItem = (itemId: string, personName: string) => {
    // Mock unclaim - in real app, this would call the API
    console.log(`Unclaiming item ${itemId} from ${personName}`);
  };

  const handleEditItem = (itemId: string, field: 'name' | 'price', value: string) => {
    setEditingItems(prev => prev.map(item => 
      item.id === itemId 
        ? { ...item, [field]: field === 'price' ? parseFloat(value) || 0 : value }
        : item
    ));
  };

  const handleDeleteItem = (itemId: string) => {
    setEditingItems(prev => prev.filter(item => item.id !== itemId));
  };

  const handleAddItem = () => {
    if (!newItemName.trim() || !newItemPrice.trim()) return;
    
    const newItem: Item = {
      id: `item-${Date.now()}`,
      name: newItemName.trim(),
      price: parseFloat(newItemPrice) || 0,
      claimedBy: []
    };
    
    setEditingItems(prev => [...prev, newItem]);
    setRealTimeUpdates(prev => [...prev, newItem]);
    setNewItemName('');
    setNewItemPrice('');
  };

  const handleSaveChanges = () => {
    if (onItemsUpdated) {
      onItemsUpdated(editingItems);
    }
    setRealTimeUpdates(editingItems);
    setIsEditMode(false);
  };

  const handleCancelEdit = () => {
    setEditingItems(expense.items);
    setIsEditMode(false);
  };

  const getItemClaimCount = (item: Item) => item.claimedBy.length;
  const getItemPricePerPerson = (item: Item) => {
    return item.claimedBy.length > 0 ? item.price / item.claimedBy.length : item.price;
  };

  const shareUrl = `${window.location.origin}/expense/${expense.id}`;
  const totalAmount = displayItems.reduce((sum, item) => sum + item.price, 0);

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 bg-white rounded-lg shadow-md">
      {/* Header - Mobile optimized */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-6">
        <div className="flex-1">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Restaurant Bill</h2>
          <p className="text-gray-600 text-sm sm:text-base">Paid by {expense.payerName}</p>
          <p className="text-sm text-gray-500">
            Total: ${totalAmount.toFixed(2)}
          </p>
          {!isEditMode && (
            <p className="text-xs text-green-600 mt-1">
              🔴 Live updates enabled
            </p>
          )}
        </div>
        
        <div className="flex flex-wrap gap-2">
          {!isEditMode && (
            <button
              onClick={() => setIsEditMode(true)}
              className="px-3 py-2 sm:px-4 sm:py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 text-sm"
            >
              Edit Items
            </button>
          )}
          <button
            onClick={() => setShowQR(!showQR)}
            className="px-3 py-2 sm:px-4 sm:py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm"
          >
            {showQR ? 'Hide QR' : 'Show QR'}
          </button>
          <button
            onClick={() => navigator.clipboard.writeText(shareUrl)}
            className="px-3 py-2 sm:px-4 sm:py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 text-sm"
          >
            Copy Link
          </button>
        </div>
      </div>

      {/* QR Code - Mobile optimized */}
      {showQR && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg text-center">
          <QRCode value={shareUrl} size={128} className="mx-auto mb-2" />
          <p className="text-sm text-gray-600">Scan to join this bill</p>
        </div>
      )}

      {/* Edit Mode - Mobile optimized */}
      {isEditMode && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="text-lg font-semibold text-yellow-800 mb-4">Edit Items</h3>
          
          {/* Add new item form - Mobile optimized */}
          <div className="flex flex-col sm:flex-row gap-2 mb-4">
            <input
              type="text"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              placeholder="Item name"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="number"
              value={newItemPrice}
              onChange={(e) => setNewItemPrice(e.target.value)}
              placeholder="Price"
              step="0.01"
              min="0"
              className="w-full sm:w-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleAddItem}
              disabled={!newItemName.trim() || !newItemPrice.trim()}
              className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              Add
            </button>
          </div>

          {/* Edit actions */}
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={handleSaveChanges}
              className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 text-sm"
            >
              Save Changes
            </button>
            <button
              onClick={handleCancelEdit}
              className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Name Input - Mobile optimized */}
      <div className="mb-6">
        <label htmlFor="personName" className="block text-sm font-medium text-gray-700 mb-2">
          Your name
        </label>
        <input
          type="text"
          id="personName"
          value={selectedPerson}
          onChange={(e) => setSelectedPerson(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter your name to claim items"
        />
      </div>

      {/* Items List - Mobile optimized */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800">Items</h3>
        {displayItems.map((item) => (
          <div key={item.id} className="border border-gray-200 rounded-lg p-4">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-2">
              <div className="flex-1">
                {isEditMode ? (
                  <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => handleEditItem(item.id, 'name', e.target.value)}
                      className="flex-1 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="flex gap-2 items-center">
                      <input
                        type="number"
                        value={item.price}
                        onChange={(e) => handleEditItem(item.id, 'price', e.target.value)}
                        step="0.01"
                        min="0"
                        className="w-20 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <h4 className="font-medium text-gray-800">{item.name}</h4>
                    <p className="text-sm text-gray-600">
                      ${item.price.toFixed(2)}
                      {getItemClaimCount(item) > 0 && (
                        <span className="ml-2">
                          (${getItemPricePerPerson(item).toFixed(2)} each)
                        </span>
                      )}
                    </p>
                  </>
                )}
              </div>
              
              {!isEditMode && selectedPerson.trim() && (
                <button
                  onClick={() => handleClaimItem(item.id)}
                  disabled={item.claimedBy.includes(selectedPerson) || isClaiming === item.id}
                  className={`px-3 py-1 rounded-md text-sm min-w-[80px] ${
                    item.claimedBy.includes(selectedPerson)
                      ? 'bg-green-100 text-green-800 cursor-not-allowed'
                      : isClaiming === item.id
                      ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                      : 'bg-blue-500 text-white hover:bg-blue-600'
                  }`}
                >
                  {isClaiming === item.id ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1"></div>
                      Claiming...
                    </div>
                  ) : item.claimedBy.includes(selectedPerson) ? (
                    'Claimed'
                  ) : (
                    'Claim'
                  )}
                </button>
              )}
            </div>
            
            {!isEditMode && item.claimedBy.length > 0 && (
              <div className="mt-2">
                <p className="text-sm text-gray-600 mb-1">Claimed by:</p>
                <div className="flex flex-wrap gap-1">
                  {item.claimedBy.map((person, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800"
                    >
                      {person}
                      {person === selectedPerson && (
                        <button
                          onClick={() => handleUnclaimItem(item.id, person)}
                          className="ml-1 text-blue-600 hover:text-blue-800"
                        >
                          ×
                        </button>
                      )}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Split Summary - Mobile optimized */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Split Summary</h3>
        <div className="space-y-2">
          {expense.people.map((person) => (
            <div key={person.name} className="flex justify-between items-center">
              <span className="font-medium">{person.name}</span>
              <span className="text-lg font-semibold">
                ${person.amountOwed.toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ExpenseView; 