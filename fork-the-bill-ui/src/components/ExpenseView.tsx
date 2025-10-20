import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Expense, Item } from '../types';
import QRCode from 'react-qr-code';
import { useMetaTags } from '../hooks/useMetaTags';
import { 
  claimItem, 
  unclaimItem, 
  getExpense,
  updateExpenseItems,
  updateExpenseTaxServiceCharge,
  updateExpenseDiscount,
  updatePersonCompletionStatus,
  addPersonToExpense,
} from '../api/client';
import { usePersonName } from '../hooks/usePersonName';

const ExpenseView: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [expense, setExpense] = useState<Expense | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPerson, setSelectedPerson] = usePersonName();
  const [showQR, setShowQR] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingItems, setEditingItems] = useState<Item[]>([]);
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [newItemQuantity, setNewItemQuantity] = useState('1');
  const [isClaiming, setIsClaiming] = useState<string | null>(null);
  const [realTimeUpdates, setRealTimeUpdates] = useState<Item[]>([]);
  const [editingTax, setEditingTax] = useState(0);
  const [editingServiceCharge, setEditingServiceCharge] = useState(0);
  const [editingDiscount, setEditingDiscount] = useState(0);
  const [isEditingTax, setIsEditingTax] = useState(false);
  const [isEditingServiceCharge, setIsEditingServiceCharge] = useState(false);
  const [isEditingDiscount, setIsEditingDiscount] = useState(false);
  const [expandedPersons, setExpandedPersons] = useState<Set<string>>(new Set());
  const [linkCopied, setLinkCopied] = useState(false);

  // Set dynamic meta tags for WhatsApp/social sharing
  const shareUrl = `${window.location.origin}/${slug}`;
  useMetaTags({
    title: expense ? `${expense.restaurantName} - Fork the bill` : 'Fork the Bill',
    description: expense 
      ? `Split the bill from ${expense.restaurantName}. Total: ₹${expense.totalAmount.toFixed(2)} paid by ${expense.payerName}. Join to claim your items!`
      : 'Easily split restaurant bills with friends!',
    ogTitle: expense ? `${expense.restaurantName} - Fork the bill` : 'Fork the Bill',
    ogDescription: expense 
      ? `Split the bill from ${expense.restaurantName}. Total: ₹${expense.totalAmount.toFixed(2)} paid by ${expense.payerName}. Join to claim your items!`
      : 'Easily split restaurant bills with friends!',
    ogUrl: shareUrl,
    ogImage: `${window.location.origin}/logo512.png`,
    ogType: 'website'
  });

  const togglePersonExpansion = (personName: string) => {
    setExpandedPersons(prev => {
      const newSet = new Set(prev);
      if (newSet.has(personName)) {
        newSet.delete(personName);
      } else {
        newSet.add(personName);
      }
      return newSet;
    });
  };

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

  useEffect(() => {
    if (expense) {
      setRealTimeUpdates(expense.items);
      setEditingItems(expense.items);
      setEditingTax(expense.tax);
      setEditingServiceCharge(expense.serviceCharge);
      setEditingDiscount(expense.discount || 0);
    }
  }, [expense]);


  const displayItems = isEditMode ? editingItems : realTimeUpdates;
  
  // Sort items to ensure consistent ordering, especially for items with same name
  const sortedDisplayItems = [...displayItems].sort((a, b) => {
    // First sort by name
    if (a.name !== b.name) {
      return a.name.localeCompare(b.name);
    }
    // For items with same name, sort by ID to ensure consistent portion numbering
    return a.id.localeCompare(b.id);
  });

  const hasMultipleQuantities = (item: Item) => {
    return item.quantity !== item.totalQuantity;
  };

  const getPortionNumber = (item: Item, allItems: Item[]) => {
    // Find all items with the same name that have multiple quantities
    const sameNameItems = allItems.filter(i => i.name === item.name && hasMultipleQuantities(i));
    
    // If there's only one item with this name, or it's not split, return 1
    if (sameNameItems.length <= 1) {
      return 1;
    }
    
    // Items are already sorted by name then ID, so we can use the order directly
    const portionNumber = sameNameItems.findIndex(i => i.id === item.id) + 1;
    
    return portionNumber;
  };

  // Helper function to get quantity badge text
  const getQuantityBadgeText = (item: Item) => {
    const portionNumber = getPortionNumber(item, sortedDisplayItems);
    return `${portionNumber} of ${item.totalQuantity}`;
  };

  const getAllPeople = () => {
    return expense?.people?.map(person => person.name) || [];
  };

  const getPersonCompletionStatus = (personName: string) => {
    const person = expense?.people?.find(p => p.name === personName);

    // If person doesn't exist, return false (not finished)
    if (!person) {
      return false;
    }
    
    return person.isFinished === undefined ? false : person.isFinished;
  };

  const handleToggleClaimItem = async (itemId: string) => {
    if (!selectedPerson.trim() || !expense?.slug) return;
    
    setIsClaiming(itemId);
    
    try {
      let currentExpense = expense;
      let person = currentExpense?.people?.find(p => p.name === selectedPerson);

      // Check if item is already claimed by the current user
      const item = currentExpense.items.find(i => i.id === itemId);
      const isAlreadyClaimed = item?.claimedBy.includes(selectedPerson);

      if (isAlreadyClaimed) {
        // Unclaim the item
        if (!person?.id) {
          throw new Error(`Cannot unclaim: Person "${selectedPerson}" not found in expense`);
        }
        const updatedExpense = await unclaimItem(expense.slug, itemId, person.id);
        setExpense(updatedExpense);
      } else {
        // Claim the item
        if (!person?.id) {
          console.log(`Adding new person "${selectedPerson}" to expense before claiming`);
          currentExpense = await addPersonToExpense(expense.slug, selectedPerson);
          person = currentExpense.people.find(p => p.name === selectedPerson);

          if (!person?.id) {
            throw new Error(`Failed to add person "${selectedPerson}" to expense`);
          }

          setExpense(currentExpense);
        }

        const updatedExpense = await claimItem(expense.slug, itemId, person.id);
        setExpense(updatedExpense);
      }
    } catch (error: any) {
      console.error('Failed to toggle claim item:', error);
    } finally {
      setIsClaiming(null);
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
    if (!newItemName.trim() || !newItemPrice.trim() || !newItemQuantity.trim()) return;

    const quantity = parseInt(newItemQuantity) || 1;
    const totalPrice = parseFloat(newItemPrice) || 0;
    const pricePerItem = totalPrice / quantity; // Divide total price by quantity
    const name = newItemName.trim();
    
    // Create multiple items if quantity > 1
    const newItems: Item[] = [];
    for (let i = 0; i < quantity; i++) {
      const newItem: Item = {
        id: `new-${Date.now()}-${i}`, // Local UI identifier, not sent to API
        name: name,
        price: pricePerItem, // Each item gets the divided price
        quantity: 1,
        totalQuantity: quantity,
        claimedBy: []
      };
      newItems.push(newItem);
    }

    setEditingItems(prev => [...prev, ...newItems]);
    setRealTimeUpdates(prev => [...prev, ...newItems]);
    setNewItemName('');
    setNewItemPrice('');
    setNewItemQuantity('1');
  };

  const handleSaveChanges = async () => {
    if (!expense?.slug) return;
    
    try {
      const itemsChanged = JSON.stringify(editingItems) !== JSON.stringify(expense.items);
      if (itemsChanged) {
        const updatedExpense = await updateExpenseItems(expense.slug, editingItems);
        setExpense(updatedExpense);
      }
      
      setIsEditMode(false);
    } catch (error) {
      console.error('Failed to save changes:', error);
    }
  };

  const handleCancelEdit = () => {
    if (expense) {
      setEditingItems(expense.items);
    }
    setIsEditMode(false);
  };

  const handleSaveTax = async () => {
    if (!expense?.slug) return;
    
    try {
      const updatedExpense = await updateExpenseTaxServiceCharge(expense.slug, editingTax, expense.serviceCharge);
      setExpense(updatedExpense);
      setIsEditingTax(false);
    } catch (error) {
      console.error('Failed to save tax:', error);
    }
  };

  const handleCancelTax = () => {
    if (expense) {
      setEditingTax(expense.tax);
    }
    setIsEditingTax(false);
  };

  const handleSaveServiceCharge = async () => {
    if (!expense?.slug) return;
    
    try {
      const updatedExpense = await updateExpenseTaxServiceCharge(expense.slug, expense.tax, editingServiceCharge);
      setExpense(updatedExpense);
      setIsEditingServiceCharge(false);
    } catch (error) {
      console.error('Failed to save service charge:', error);
    }
  };

  const handleCancelServiceCharge = () => {
    if (expense) {
      setEditingServiceCharge(expense.serviceCharge);
    }
    setIsEditingServiceCharge(false);
  };

  const handleSaveDiscount = async () => {
    if (!expense?.slug) return;
    
    try {
      const updatedExpense = await updateExpenseDiscount(expense.slug, editingDiscount);
      setExpense(updatedExpense);
      setIsEditingDiscount(false);
    } catch (error) {
      console.error('Failed to save discount:', error);
    }
  };

  const handleCancelDiscount = () => {
    if (expense) {
      setEditingDiscount(expense.discount || 0);
    }
    setIsEditingDiscount(false);
  };

  const handleToggleCompletionStatus = async (personName: string) => {
    if (!expense?.slug) return;
    
    try {
      const currentStatus = getPersonCompletionStatus(personName);
      const newStatus = !currentStatus;
      
      const updatedExpense = await updatePersonCompletionStatus(expense.slug, personName, newStatus);
      setExpense(updatedExpense);
    } catch (error) {
      console.error('Failed to update completion status:', error);
    }
  };

  const getItemClaimCount = (item: Item) => item.claimedBy.length;
  const getItemPricePerPerson = (item: Item) => {
    return item.claimedBy.length > 0 ? item.price / item.claimedBy.length : item.price;
  };

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

  //Todo: Verify if this is correct
  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 py-8 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error: {error}</p>
          <button
            onClick={() => window.location.href = '/'}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
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
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const currentShareUrl = `${window.location.origin}/${expense.slug}`;
  const allPeople = getAllPeople();
  const finishedPeople = allPeople.filter(person => getPersonCompletionStatus(person));

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-4xl mx-auto p-4 sm:p-6 bg-white rounded-lg shadow-md">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-6">
        <div className="flex-1">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800">{expense.restaurantName}</h2>
          <p className="text-gray-600 text-sm sm:text-base font-bold">Paid by {expense.payerName}</p>
          <div className="text-sm text-gray-500 space-y-1">
            <p className="font-bold">Subtotal: ₹{expense.subtotal.toFixed(2)}</p>
            <div className="flex items-center gap-2">
              {isEditingTax ? (
                <>
                  <span className="font-bold">Tax: ₹</span>
                  <input
                    type="number"
                    value={editingTax}
                    onChange={(e) => setEditingTax(parseFloat(e.target.value) || 0)}
                    step="0.01"
                    min="0"
                    className="w-20 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                  />
                  <button
                    onClick={handleSaveTax}
                    className="px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-xs"
                  >
                    ✓
                  </button>
                  <button
                    onClick={handleCancelTax}
                    className="px-2 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 text-xs"
                  >
                    ✕
                  </button>
                </>
              ) : (
                <>
                  <span className="font-bold">Tax: ₹{editingTax.toFixed(2)}</span>
                  <button
                    onClick={() => setIsEditingTax(true)}
                    className="px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs"
                  >
                    Edit
                  </button>
                </>
              )}
            </div>
            <div className="flex items-center gap-2">
              {isEditingServiceCharge ? (
                <>
                  <span className="font-bold">Service Charge: ₹</span>
                  <input
                    type="number"
                    value={editingServiceCharge}
                    onChange={(e) => setEditingServiceCharge(parseFloat(e.target.value) || 0)}
                    step="0.01"
                    min="0"
                    className="w-20 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                  />
                  <button
                    onClick={handleSaveServiceCharge}
                    className="px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-xs"
                  >
                    ✓
                  </button>
                  <button
                    onClick={handleCancelServiceCharge}
                    className="px-2 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 text-xs"
                  >
                    ✕
                  </button>
                </>
              ) : (
                <>
                  <span className="font-bold">Service Charge: ₹{editingServiceCharge.toFixed(2)}</span>
                  <button
                    onClick={() => setIsEditingServiceCharge(true)}
                    className="px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs"
                  >
                    Edit
                  </button>
                </>
              )}
            </div>
            <div className="flex items-center gap-2">
              {isEditingDiscount ? (
                <>
                  <span className="font-bold">Discount: ₹</span>
                  <input
                    type="number"
                    value={editingDiscount}
                    onChange={(e) => setEditingDiscount(parseFloat(e.target.value) || 0)}
                    step="0.01"
                    min="0"
                    className="w-20 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                  />
                  <button
                    onClick={handleSaveDiscount}
                    className="px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-xs"
                  >
                    ✓
                  </button>
                  <button
                    onClick={handleCancelDiscount}
                    className="px-2 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 text-xs"
                  >
                    ✕
                  </button>
                </>
              ) : (
                <>
                  <span className="font-bold">Discount: ₹{(editingDiscount || 0).toFixed(2)}</span>
                  <button
                    onClick={() => setIsEditingDiscount(true)}
                    className="px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs"
                  >
                    Edit
                  </button>
                </>
              )}
            </div>
            <p className="font-semibold">Total: ₹{expense.totalAmount.toFixed(2)}</p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {!isEditMode && (
            <button
              onClick={() => setIsEditMode(true)}
              className="px-3 py-2 sm:px-4 sm:py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 text-sm"
            >
              Add/Edit Items
            </button>
          )}
          <button
            onClick={() => setShowQR(!showQR)}
            className="px-3 py-2 sm:px-4 sm:py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
          >
            {showQR ? 'Hide QR' : 'Show QR'}
          </button>
          <button
            onClick={() => {
              navigator.clipboard.writeText(currentShareUrl);
              setLinkCopied(true);
              setTimeout(() => setLinkCopied(false), 2000);
            }}
            className="px-3 py-2 sm:px-4 sm:py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 text-sm"
          >
            {linkCopied ? 'Link Copied!' : 'Copy Link'}
          </button>
        </div>
      </div>


      {/* QR Code - Mobile optimized */}
      {showQR && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg text-center">
          <QRCode value={currentShareUrl} size={128} className="mx-auto mb-2" />
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
                      <span className="text-xs bg-blue-200 text-blue-900 px-2 py-1 rounded-full">
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
          <h3 className="text-lg font-semibold text-yellow-800 mb-4">Add/Edit Items</h3>
          
          {/* Instructions */}
          <p className="text-sm text-gray-600 mb-3">Enter new item below or update existing items in the list</p>
          
          {/* Add new item form - Mobile optimized */}
          <div className="flex flex-col sm:flex-row gap-2 mb-4">
            <input
              type="text"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              placeholder="Enter new item name"
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
            <input
              type="number"
              value={newItemQuantity}
              onChange={(e) => setNewItemQuantity(e.target.value)}
              placeholder="Qty"
              min="1"
              className="w-full sm:w-16 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleAddItem}
              disabled={!newItemName.trim() || !newItemPrice.trim() || !newItemQuantity.trim()}
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
        {sortedDisplayItems.map((item) => (
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
                        className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-medium text-gray-800">{item.name}</h4>
                      {hasMultipleQuantities(item) && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-200 text-blue-900">
                          {getQuantityBadgeText(item)}
                        </span>
                      )}
                    </div>
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
                  onClick={() => handleToggleClaimItem(item.id)}
                  disabled={isClaiming === item.id}
                  className={`px-3 py-1 rounded-md text-sm min-w-[80px] ${
                    isClaiming === item.id
                      ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                      : item.claimedBy.includes(selectedPerson)
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {isClaiming === item.id ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1"></div>
                      {item.claimedBy.includes(selectedPerson) ? 'Unclaiming...' : 'Claiming...'}
                    </div>
                  ) : item.claimedBy.includes(selectedPerson) ? (
                    'Unclaim'
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
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-200 text-blue-900"
                    >
                      {person}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-4 py-4 border-b border-gray-200">
          <h3 className="text-lg font-bold text-gray-800">Split Summary</h3>
        </div>
        
        <div className="divide-y divide-gray-100">
          {expense.people
            .slice()
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((person) => {
              const isExpanded = expandedPersons.has(person.name);
              return (
                <div key={person.name} className="p-4">
                  {/* Person Header - Clickable */}
                  <div 
                    className="flex justify-between items-center cursor-pointer hover:bg-gray-50 -m-2 p-2 rounded"
                    onClick={() => togglePersonExpansion(person.name)}
                  >
                    <div className="flex items-center">
                      <h4 className="font-semibold text-lg text-gray-800">{person.name}</h4>
                      <svg 
                        className={`w-4 h-4 ml-2 text-gray-500 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                    <div className="text-lg font-semibold text-slate-800">
                      ₹{person.totalOwed.toFixed(2)}
                    </div>
                  </div>
                  
                  {/* Breakdown Details - Collapsible */}
                  {isExpanded && (
                    <div className="mt-3 space-y-2 text-sm">
                      <div className="flex justify-between text-gray-700">
                        <span>Items:</span>
                        <span className="font-medium text-gray-800">₹{person.subtotal.toFixed(2)}</span>
                      </div>
                      
                      {person.taxShare > 0 && (
                        <div className="flex justify-between text-gray-700">
                          <span>Tax:</span>
                          <span className="font-medium text-gray-800">₹{person.taxShare.toFixed(2)}</span>
                        </div>
                      )}
                      
                      {person.serviceChargeShare > 0 && (
                        <div className="flex justify-between text-gray-700">
                          <span>Service Charge:</span>
                          <span className="font-medium text-gray-800">₹{person.serviceChargeShare.toFixed(2)}</span>
                        </div>
                      )}
                      
                      {(person.discountShare || 0) > 0 && (
                        <div className="flex justify-between text-gray-700">
                          <span>Discount:</span>
                          <span className="font-medium text-green-600">-₹{(person.discountShare || 0).toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          
          {/* Total Row */}
          <div className="p-4 bg-slate-50 border-t-2 border-slate-300">
            <div className="flex justify-between items-center">
              <h4 className="font-bold text-lg text-slate-900">Total</h4>
              <div className="text-xl font-bold text-slate-800">
                ₹{expense.people.reduce((total, person) => total + person.totalOwed, 0).toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};

export default ExpenseView; 