import React, { useState, useEffect } from 'react';
import { Expense, Item } from '../types';
import QRCode from 'react-qr-code';
import { 
  claimItem, 
  unclaimItem, 
} from '../api/client';

interface ExpenseViewProps {
  expense: Expense;
  onItemClaimed: (itemId: string, personName: string) => void;
  onItemsUpdated?: (items: Item[]) => void;
  onTaxTipUpdated?: (tax: number, tip: number) => void;
  onCompletionStatusUpdated?: (personName: string, isFinished: boolean) => void;
}

const ExpenseView: React.FC<ExpenseViewProps> = ({ expense, onItemClaimed, onItemsUpdated, onTaxTipUpdated, onCompletionStatusUpdated }) => {
  const [selectedPerson, setSelectedPerson] = useState('');
  const [showQR, setShowQR] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingItems, setEditingItems] = useState<Item[]>(expense.items);
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [isClaiming, setIsClaiming] = useState<string | null>(null);
  const [realTimeUpdates, setRealTimeUpdates] = useState<Item[]>(expense.items);
  const [editingTax, setEditingTax] = useState(expense.tax);
  const [editingTip, setEditingTip] = useState(expense.tip);

  // Update real-time updates when expense changes
  useEffect(() => {
    console.log('🎯 ExpenseView: Expense prop changed, people:', expense.people.map(p => ({ name: p.name, isFinished: p.isFinished })));
    setRealTimeUpdates(expense.items);
    setEditingItems(expense.items);
  }, [expense.items, expense.people]);


  // Use real-time updates when not in edit mode
  const displayItems = isEditMode ? editingItems : realTimeUpdates;

  const getAllPeople = () => {
    return expense.people.map(person => person.name);
  };

  // Get completion status from expense.people
  const getPersonCompletionStatus = (personName: string) => {
    const person = expense.people.find(p => p.name === personName);

    // If person doesn't exist, return false (not finished)
    if (!person) {
      console.log(`🎯 ExpenseView: Person "${personName}" not found in expense, returning false`);
      return false;
    }
    
    // If person exists but isFinished is undefined, return false
    const isFinished = person.isFinished === undefined ? false : person.isFinished;
    console.log(`🎯 ExpenseView: getPersonCompletionStatus(${personName}) = ${isFinished}`);
    return isFinished;
  };

  const handleClaimItem = async (itemId: string) => {
    if (!selectedPerson.trim() || !expense.slug) return;
    
    setIsClaiming(itemId);
    
    try {
      console.log('🎯 About to call claimItem API...');
      const updatedExpense = await claimItem(expense.slug, itemId, selectedPerson);
      console.log('🎯 claimItem API call succeeded, got response:', updatedExpense);
      
      // Update local state with the response
      setRealTimeUpdates(updatedExpense.items);
      setEditingItems(updatedExpense.items);
      onItemClaimed(itemId, selectedPerson);
      
      const item = updatedExpense.items.find(i => i.id === itemId);
      if (item && item.claimedBy.includes(selectedPerson)) {
        console.log('🎯 Successfully claimed item:', item.name);
      }
    } catch (error: any) {
      console.error('❌ Failed to claim item:', error);
      
      const errorMsg = error?.message || 'Failed to claim item. Please try again.';
      console.log('❌ Error claiming item:', errorMsg);
    } finally {
      setIsClaiming(null);
    }
  };

  const handleUnclaimItem = async (itemId: string, personName: string) => {
    if (!expense.slug) return;
    
    try {
      // Use real API to unclaim item
      const updatedExpense = await unclaimItem(expense.slug, itemId, personName);
      
      // Update local state with the response
      setRealTimeUpdates(updatedExpense.items);
      setEditingItems(updatedExpense.items);
      
      // Notify parent component to refresh expense data
      onItemClaimed(itemId, personName);
      
      const item = updatedExpense.items.find(i => i.id === itemId);
      if (item) {
        console.log('🎯 Successfully unclaimed item:', item.name);
      }
    } catch (error: any) {
      console.error('Failed to unclaim item:', error);
      
      const errorMsg = error?.message || 'Failed to unclaim item. Please try again.';
      console.log('❌ Error unclaiming item:', errorMsg);
    }
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

  const handleSaveChanges = async () => {
    if (!expense.slug) return;
    
    try {
      // Update items if they changed - let parent handle the API call
      if (onItemsUpdated) {
        onItemsUpdated(editingItems);
      }
      
      // Update tax/tip if they changed - let parent handle the API call
      if (onTaxTipUpdated && (editingTax !== expense.tax || editingTip !== expense.tip)) {
        onTaxTipUpdated(editingTax, editingTip);
      }
      
      setRealTimeUpdates(editingItems);
      setIsEditMode(false);
      console.log('🎯 Changes saved successfully');
    } catch (error) {
      console.error('Failed to save changes:', error);
    }
  };

  const handleCancelEdit = () => {
    setEditingItems(expense.items);
    setEditingTax(expense.tax);
    setEditingTip(expense.tip);
    setIsEditMode(false);
  };

  const handleToggleCompletionStatus = async (personName: string) => {
    if (!expense.slug || !onCompletionStatusUpdated) return;
    
    try {
      const currentStatus = getPersonCompletionStatus(personName);
      const newStatus = !currentStatus;
      
      onCompletionStatusUpdated(personName, newStatus);
    } catch (error) {
      console.error('Failed to update completion status:', error);
    }
  };

  const getItemClaimCount = (item: Item) => item.claimedBy.length;
  const getItemPricePerPerson = (item: Item) => {
    return item.claimedBy.length > 0 ? item.price / item.claimedBy.length : item.price;
  };

  const shareUrl = `${window.location.origin}/${expense.slug || expense.id}`;
  const subtotal = displayItems.reduce((sum, item) => sum + item.price, 0);
  const totalAmount = subtotal + editingTax + editingTip;

  // Get completion status
  const allPeople = getAllPeople();
  const finishedPeople = allPeople.filter(person => getPersonCompletionStatus(person));

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 bg-white rounded-lg shadow-md">
      {/* Header - Mobile optimized */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-6">
        <div className="flex-1">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Restaurant Bill</h2>
          <p className="text-gray-600 text-sm sm:text-base">Paid by {expense.payerName}</p>
          <div className="text-sm text-gray-500 space-y-1">
            <p>Subtotal: ₹{subtotal.toFixed(2)}</p>
            <p>Tax: ₹{editingTax.toFixed(2)}</p>
            <p>Tip: ₹{editingTip.toFixed(2)}</p>
            <p className="font-semibold">Total: ₹{totalAmount.toFixed(2)}</p>
          </div>
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

      {/* Completion Status - All Users */}
      {!isEditMode && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <h3 className="text-lg font-semibold text-green-800 mb-3">Everyone's Status</h3>
          <div className="space-y-3">
            {allPeople.map((personName) => {
              const isFinished = getPersonCompletionStatus(personName);
              const isCurrentUser = personName === selectedPerson;
              
              return (
                <div key={personName} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{personName}</span>
                    {isCurrentUser && (
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                        You
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {isFinished ? (
                      <span className="inline-flex items-center text-green-600">
                        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Finished
                      </span>
                    ) : (
                      <span className="inline-flex items-center text-gray-500">
                        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                        </svg>
                        Pending
                      </span>
                    )}
                    
                    {isCurrentUser && (
                      <button
                        onClick={() => handleToggleCompletionStatus(personName)}
                        className={`px-3 py-1 rounded-md text-sm ${
                          isFinished
                            ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                            : 'bg-green-500 text-white hover:bg-green-600'
                        }`}
                      >
                        {isFinished ? 'Mark as Pending' : 'Mark as Finished'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-3 pt-3 border-t border-green-200">
            <p className="text-sm text-green-700">
              {finishedPeople.length} of {allPeople.length} people have marked themselves as finished
            </p>
          </div>
        </div>
      )}

      {/* Edit Mode - Mobile optimized */}
      {isEditMode && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="text-lg font-semibold text-yellow-800 mb-4">Edit Items & Tax/Tip</h3>
          
          {/* Tax and Tip editing */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tax Amount
              </label>
              <input
                type="number"
                value={editingTax}
                onChange={(e) => setEditingTax(parseFloat(e.target.value) || 0)}
                step="0.01"
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tip Amount
              </label>
              <input
                type="number"
                value={editingTip}
                onChange={(e) => setEditingTip(parseFloat(e.target.value) || 0)}
                step="0.01"
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
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
                      ₹{item.price.toFixed(2)}
                      {getItemClaimCount(item) > 0 && (
                        <span className="ml-2">
                          (₹{getItemPricePerPerson(item).toFixed(2)} each)
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
        <div className="space-y-4">
          {expense.people.map((person) => (
            <div key={person.name} className="border-b border-gray-200 pb-3 last:border-b-0">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium text-lg">{person.name}</span>
                <span className="text-lg font-semibold text-blue-600">
                  ₹{person.totalOwed.toFixed(2)}
                </span>
              </div>
              <div className="text-sm text-gray-600 space-y-1">
                <div className="flex justify-between">
                  <span>Items:</span>
                  <span>₹{person.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax ({((person.subtotal / subtotal) * 100).toFixed(1)}%):</span>
                  <span>₹{person.taxShare.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tip ({((person.subtotal / subtotal) * 100).toFixed(1)}%):</span>
                  <span>₹{person.tipShare.toFixed(2)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ExpenseView; 