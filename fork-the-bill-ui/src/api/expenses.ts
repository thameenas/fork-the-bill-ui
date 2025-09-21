// Re-export all API functions from the new client
export {
  getExpense,
  createExpense,
  createExpenseFromImage,
  updateExpense,
  claimItem,
  unclaimItem,
  addPersonToExpense,
  markPersonAsFinished,
  markPersonAsPending,
  updateExpenseItems,
  updateExpenseTaxTip,
  updatePersonCompletionStatus,
} from './client';