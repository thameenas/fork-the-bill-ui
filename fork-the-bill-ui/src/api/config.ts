// API Configuration
export const API_CONFIG = {
  // Base URLs for different environments
  // In development, use proxy (empty string), in production use full URL
  BASE_URL: process.env.REACT_APP_API_BASE_URL || (process.env.NODE_ENV === 'local' ? 'http://localhost:8080' : ''),
  // API endpoints
  ENDPOINTS: {
    // Expense endpoints
    EXPENSE: '/expense',
    EXPENSE_UPLOAD: '/expense/upload',
    EXPENSE_BY_SLUG: (slug: string) => `/expense/${slug}`,
    
    // Item endpoints
    CLAIM_ITEM: (slug: string, itemId: string) => `/expense/${slug}/items/${itemId}/claim`,
    UNCLAIM_ITEM: (slug: string, itemId: string, personId: string) => `/expense/${slug}/items/${itemId}/claim/${personId}`,
    
    // Person endpoints
    ADD_PERSON: (slug: string) => `/expense/${slug}/people`,
    MARK_PERSON_FINISHED: (slug: string, personId: string) => `/expense/${slug}/people/${personId}/finish`,
    MARK_PERSON_PENDING: (slug: string, personId: string) => `/expense/${slug}/people/${personId}/pending`,
  },
  
  // Request configuration
  DEFAULT_HEADERS: {
    'Content-Type': 'application/json',
  },
  
  // Timeout configuration
  TIMEOUT: 10000, // 10 seconds
};

// Helper function to get full URL
export const getApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

// Environment detection
export const isDevelopment = process.env.NODE_ENV === 'development';
export const isProduction = process.env.NODE_ENV === 'production';
