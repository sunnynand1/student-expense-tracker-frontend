import axios from 'axios';
import { toast } from 'react-toastify';

// Use relative URLs in development (handled by proxy) and absolute in production
const isDevelopment = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;

// In development, we use relative URLs that will be proxied to the backend
// In production, use the deployed backend URL
const API_URL = isDevelopment 
  ? '/api' // This will be proxied to http://localhost:5000/api
  : 'https://student-expense-tracker-backend-sunnynand1.onrender.com/api';

console.log(`Using API URL: ${API_URL} (${isDevelopment ? 'development' : 'production'} mode)`);

// Navigation will be handled by React Router's useNavigate hook
let navigate = null;

const setNavigate = (navigateFn) => {
  navigate = navigateFn;
};

// Function to get the auth token
const getAuthToken = () => {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const token = user?.token || '';
    if (token) {
      console.log('Retrieved token from localStorage:', `${token.substring(0, 10)}...`);
    } else {
      console.warn('No token found in localStorage');
    }
    return token;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return '';
  }
};

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Important for cookies, authorization headers
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
    // Remove CORS headers from frontend - they should only be in the response
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  },
  timeout: 20000, // 20 seconds timeout
  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-XSRF-TOKEN',
  validateStatus: function (status) {
    // Consider all status codes less than 500 as success to handle custom error responses
    return status < 500;
  }
});

// Network error handling is done in the response interceptor

// Helper function to handle forced logout
const forceLogout = () => {
  console.log('Forcing logout...');
  // Clear user data from localStorage
  localStorage.removeItem('user');
  localStorage.removeItem('token');
  
  // Clear any auth headers
  delete api.defaults.headers.common['Authorization'];
  
  // If we have a navigate function, redirect to login
  if (navigate) {
    navigate('/login');
    navigate('/login', { 
      state: { 
        from: window.location.pathname,
        message: 'Your session has expired. Please login again.'
      },
      replace: true 
    });
  } else {
    // If we can't navigate, at least redirect to login
    window.location.href = '/login';
  }
};

// Single request interceptor to handle all requests
api.interceptors.request.use(
  (config) => {
    // Add auth token to every request if available
    const token = getAuthToken();
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Add cache control headers for GET requests
    if (config.method === 'get') {
      config.headers['Cache-Control'] = 'no-cache';
      config.headers['Pragma'] = 'no-cache';
    }
    
    console.log('[API Request]', {
      url: config.url,
      method: config.method,
      data: config.data,
      headers: config.headers,
      withCredentials: config.withCredentials
    });
    
    // Skip adding auth header for login/register requests
    const publicEndpoints = ['/auth/login', '/auth/register'];
    const isPublicEndpoint = publicEndpoints.some(endpoint => 
      config.url.endsWith(endpoint)
    );

    // Add auth token for non-public endpoints
    if (!isPublicEndpoint) {
      const token = getAuthToken();
      if (token) {
        // Ensure headers object exists
        config.headers = config.headers || {};
        // Set the Authorization header
        config.headers.Authorization = `Bearer ${token}`;
      } else {
        console.warn('No auth token available for protected endpoint:', config.url);
      }
    }
    
    // Ensure credentials are included for all requests
    config.withCredentials = true;
    
    // Add timestamp to prevent caching
    if (config.method === 'get') {
      config.params = {
        ...config.params,
        _t: new Date().getTime()
      };
    }

    // Log the request
    console.log(`[API] ${config.method.toUpperCase()} ${config.url}`, {
      params: config.params,
      data: config.data
    });

    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors and token refresh
api.interceptors.response.use(
  (response) => {
    console.log('[API Response]', {
      url: response.config.url,
      status: response.status,
      data: response.data,
      headers: response.headers
    });
    return response;
  },
  async (error) => {
    console.error('[API Error]', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      headers: error.response?.headers,
      code: error.code,
      message: error.message,
      config: error.config
    });

    // Handle network errors (like when the backend is down)
    if (error.code === 'ERR_NETWORK' || error.code === 'ECONNABORTED' || !error.response) {
      // Show appropriate error message based on environment
      if (isDevelopment) {
        toast.error('Network error. Please make sure the backend server is running at http://localhost:5000');
      } else {
        toast.error('Unable to connect to the server. Please check your internet connection and try again.');
      }
      
      return Promise.reject(error);
    }

    const originalRequest = error.config;
    
    // Handle token expiration (401) and avoid infinite loops
    if (error.response?.status === 401 && 
        originalRequest && 
        !originalRequest._retry && 
        !originalRequest.url?.includes('/auth/refresh-token')) {
      
      // Mark this request as retried to prevent infinite loops
      originalRequest._retry = true;
      
      try {
        console.log('Token expired, attempting to refresh...');
        
        // Get current token to send with refresh request
        const currentToken = getAuthToken();
        
        if (!currentToken) {
          console.warn('No token available for refresh, forcing logout');
          forceLogout();
          return Promise.reject(new Error('Authentication failed'));
        }
        
        console.log('Attempting to refresh token with current token:', currentToken ? `${currentToken.substring(0, 10)}...` : 'none');
        
        // Try to refresh the token, sending the current token in the Authorization header
        const response = await axios.post(`${API_URL}/auth/refresh-token`, {}, {
          headers: {
            'Authorization': `Bearer ${currentToken}`
          },
          withCredentials: true // Ensure cookies are sent
        });
        
        if (response.data?.token) {
          console.log('Token refreshed successfully');
          
          // Update token in localStorage
          const user = JSON.parse(localStorage.getItem('user') || '{}');
          user.token = response.data.token;
          localStorage.setItem('user', JSON.stringify(user));
          
          // Update Authorization header for the original request
          originalRequest.headers.Authorization = `Bearer ${response.data.token}`;
          
          // Retry the original request
          return api(originalRequest);
        } else {
          throw new Error('No token received in refresh response');
        }
      } catch (refreshError) {
        console.error('Failed to refresh token:', refreshError);
        forceLogout();
        return Promise.reject(refreshError);
      }
    }
    
    // Handle other errors
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('API Error Response:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        headers: error.response.headers
      });
      
      // Handle 401 Unauthorized (when refresh token also fails)
      if (error.response.status === 401) {
        console.log('Authentication failed, forcing logout...');
        forceLogout();
      } else if (error.response.status === 403) {
        console.warn('Permission denied:', error.response.data?.message);
      } else if (error.response.status === 404) {
        console.warn('Resource not found:', error.response.data?.message);
      } else if (error.response.status >= 500) {
        console.error('Server error:', error.response.data?.message);
      } else {
        // Log error message from server if available
        const errorMessage = error.response.data?.message || `Request failed with status ${error.response.status}`;
        console.error(errorMessage);
      }
      
      return Promise.reject(error.response.data || new Error(`Request failed with status ${error.response.status}`));
    } else if (error.request) {
      // The request was made but no response was received
      console.error('API Network Error:', {
        message: error.message,
        code: error.code,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          timeout: error.config?.timeout,
          withCredentials: error.config?.withCredentials
        }
      });
      console.error('Unable to connect to the server. Please check your internet connection and try again.');
      return Promise.reject(new Error('Unable to connect to the server. Please check your internet connection and try again.'));
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('API Setup Error:', {
        message: error.message,
        stack: error.stack,
        config: error.config
      });
      console.error('An error occurred while setting up the request.');
      return Promise.reject(new Error('An error occurred while setting up the request.'));
    }
  }
);

// Auth API
export const authAPI = {
  login: async (email, password) => {
    try {
      console.log('Attempting login with:', { email });
      const response = await api.post('/auth/login', { email, password }, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        withCredentials: true,
        validateStatus: (status) => status < 500 // Don't throw for 4xx errors
      });
      
      console.log('Login response:', {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        data: response.data
      });
      
      // If we get a successful response
      if (response.status >= 200 && response.status < 300) {
        return response;
      }
      
      // For error responses, create a proper error object
      const error = new Error(response.data?.message || 'Login failed');
      error.response = response;
      error.status = response.status;
      throw error;
      
    } catch (error) {
      console.error('Login error details:', {
        name: error.name,
        message: error.message,
        status: error.response?.status,
        responseData: error.response?.data,
        stack: error.stack
      });
      
      // If it's an Axios error, extract the useful information
      if (error.isAxiosError) {
        const apiError = new Error(error.response?.data?.message || error.message || 'Login failed');
        apiError.response = error.response;
        apiError.status = error.response?.status;
        throw apiError;
      }
      
      throw error;
    }
  },
  
  register: async (userData) => {
    try {
      console.log('Attempting registration with:', { ...userData, password: '***' });
      
      // Add additional headers to help with CORS issues
      const response = await api.post('/auth/register', userData, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Access-Control-Allow-Origin': isDevelopment ? '*' : undefined,
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Accept, Authorization'
        },
        withCredentials: true,
        validateStatus: (status) => status < 500 // Don't throw for 4xx errors
      });
      
      console.log('Registration response:', {
        status: response.status,
        statusText: response.statusText,
        data: response.data
      });
      
      // If we get a successful response
      if (response.status >= 200 && response.status < 300) {
        toast.success('Account created successfully!');
        return response;
      }
      
      // For error responses, create a proper error object with detailed information
      const error = new Error(response.data?.message || 'Registration failed');
      error.response = response;
      error.status = response.status;
      if (response.data?.errors) {
        error.fieldErrors = response.data.errors;
      }
      throw error;
    } catch (error) {
      console.error('Registration error details:', {
        name: error.name,
        message: error.message,
        status: error.response?.status,
        responseData: error.response?.data,
        stack: error.stack
      });
      
      // If it's an Axios error, extract the useful information
      if (error.isAxiosError) {
        const apiError = new Error(error.response?.data?.message || error.message || 'Registration failed');
        apiError.response = error.response;
        apiError.status = error.response?.status;
        throw apiError;
      }
      
      throw error;
    }
  },
  
  getMe: async () => {
    // Get current token
    const token = getAuthToken();
    
    console.log('Making getMe request with token:', token ? `${token.substring(0, 10)}...` : 'none');
    
    return api.get('/auth/me', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'x-auth-token': token
      },
      withCredentials: true
    });
  },
  
  logout: () => {
    // Clear user data from localStorage
    localStorage.removeItem('user');
    return api.post('/auth/logout', {}, {
      withCredentials: true
    });
  },
};

// Expenses API
export const expensesAPI = {
  getAll: () => api.get('/expenses'),
  getById: (id) => api.get(`/expenses/${id}`),
  create: (expense) => api.post('/expenses', expense),
  update: (id, updates) => api.put(`/expenses/${id}`, updates),
  delete: (id) => api.delete(`/expenses/${id}`)
};

// Budgets API
export const budgetsAPI = {
  // Get all budgets for the current user
  getAll: async () => {
    try {
      const response = await api.get('/budgets');
      if (!response.data || !response.data.success) {
        throw new Error(response.data?.message || 'Failed to fetch budgets');
      }
      return response;
    } catch (error) {
      console.error('Error fetching budgets:', error);
      throw error.response?.data || error;
    }
  },
  
  // Get a specific budget by ID
  getById: async (id) => {
    try {
      const response = await api.get(`/budgets/${id}`);
      if (!response.data || !response.data.success) {
        throw new Error(response.data?.message || 'Budget not found');
      }
      return response;
    } catch (error) {
      console.error(`Error fetching budget ${id}:`, error);
      throw error.response?.data || error;
    }
  },
  
  // Create a new budget
  create: async (budget) => {
    try {
      // Ensure required fields are present
      if (!budget.name || !budget.amount || !budget.category) {
        throw new Error('Missing required fields: name, amount, and category are required');
      }
      
      const response = await api.post('/budgets', {
        name: budget.name,
        amount: parseFloat(budget.amount),
        category: budget.category,
        period: budget.period || 'monthly',
        planId: budget.planId || null,
        planName: budget.planName || null
      });
      
      if (!response.data || !response.data.success) {
        throw new Error(response.data?.message || 'Failed to create budget');
      }
      
      return response;
    } catch (error) {
      console.error('Error creating budget:', error);
      throw error.response?.data || error;
    }
  },
  
  // Update an existing budget
  update: async (id, updates) => {
    try {
      // Only include defined fields in the update
      const updateData = {};
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.amount !== undefined) updateData.amount = parseFloat(updates.amount);
      if (updates.category !== undefined) updateData.category = updates.category;
      if (updates.period !== undefined) updateData.period = updates.period;
      if (updates.planId !== undefined) updateData.planId = updates.planId;
      if (updates.planName !== undefined) updateData.planName = updates.planName;
      
      const response = await api.put(`/budgets/${id}`, updateData);
      
      if (!response.data || !response.data.success) {
        throw new Error(response.data?.message || 'Failed to update budget');
      }
      
      return response;
    } catch (error) {
      console.error(`Error updating budget ${id}:`, error);
      throw error.response?.data || error;
    }
  },
  
  // Delete a budget
  delete: async (id) => {
    try {
      const response = await api.delete(`/budgets/${id}`);
      
      if (!response.data || !response.data.success) {
        throw new Error(response.data?.message || 'Failed to delete budget');
      }
      
      return response;
    } catch (error) {
      console.error(`Error deleting budget ${id}:`, error);
      throw error.response?.data || error;
    }
  },
  
  // Get budgets by plan ID
  getByPlanId: async (planId) => {
    try {
      const response = await api.get(`/budgets/plan/${planId}`);
      if (!response.data || !response.data.success) {
        throw new Error(response.data?.message || 'Failed to fetch budget plan');
      }
      return response;
    } catch (error) {
      console.error(`Error fetching budget plan ${planId}:`, error);
      throw error.response?.data || error;
    }
  }
};

// Documents API
export const documentsAPI = {
  getAll: () => api.get('/documents'),
  getById: (id) => api.get(`/documents/${id}`),
  upload: (formData) => api.post('/documents/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  }),
  download: (id) => api.get(`/documents/${id}/download`, {
    responseType: 'blob'
  }),
  delete: (id) => api.delete(`/documents/${id}`)
};

// Reports API
export const reportsAPI = {
  getReport: (startDate, endDate) => api.get('/reports', {
    params: { startDate, endDate },
    timeout: 15000 // Increase timeout for reports which may take longer to generate
  })
};

// Export the API instance and other utilities
export { setNavigate };
export default api;
