import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('celestiq_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('celestiq_token');
      localStorage.removeItem('celestiq_user');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

// ==================== AUTH APIs ====================
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  verifyOTP: (data) => api.post('/auth/verify-otp', data),
  resendOTP: (data) => api.post('/auth/resend-otp', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/update-profile', data),
  addCategory: (data) => api.post('/auth/add-category', data),
  deleteCategory: (data) => api.delete('/auth/delete-category', { data }),
};

// ==================== TRANSACTION APIs ====================
export const transactionAPI = {
  getAll: (params) => api.get('/transactions', { params }),
  getById: (id) => api.get(`/transactions/${id}`),
  create: (data) => api.post('/transactions', data),
  update: (id, data) => api.put(`/transactions/${id}`, data),
  delete: (id) => api.delete(`/transactions/${id}`),
  getStats: (params) => api.get('/transactions/stats/summary', { params }),
  deleteAll: () => api.delete('/transactions'),
};

// ==================== INVESTMENT APIs ====================
export const investmentAPI = {
  getAll: (params) => api.get('/investments', { params }),
  getById: (id) => api.get(`/investments/${id}`),
  create: (data) => api.post('/investments', data),
  update: (id, data) => api.put(`/investments/${id}`, data),
  delete: (id) => api.delete(`/investments/${id}`),
  getPortfolio: () => api.get('/investments/stats/portfolio'),
};

// ==================== BUDGET APIs ====================
export const budgetAPI = {
  getAll: (params) => api.get('/budgets', { params }),
  getById: (id) => api.get(`/budgets/${id}`),
  create: (data) => api.post('/budgets', data),
  update: (id, data) => api.put(`/budgets/${id}`, data),
  delete: (id) => api.delete(`/budgets/${id}`),
  getOverview: () => api.get('/budgets/stats/overview'),
};

// ==================== GOAL APIs ====================
export const goalAPI = {
  getAll: (params) => api.get('/goals', { params }),
  getById: (id) => api.get(`/goals/${id}`),
  create: (data) => api.post('/goals', data),
  update: (id, data) => api.put(`/goals/${id}`, data),
  updateProgress: (id, data) => api.patch(`/goals/${id}/progress`, data),
  delete: (id) => api.delete(`/goals/${id}`),
  getOverview: () => api.get('/goals/stats/overview'),
};

// ==================== BROKER APIs ====================
export const brokerAPI = {
  // Manual brokers
  getAll: () => api.get('/brokers'),
  getById: (id) => api.get(`/brokers/${id}`),
  create: (data) => api.post('/brokers', data),
  update: (id, data) => api.put(`/brokers/${id}`, data),
  delete: (id) => api.delete(`/brokers/${id}`),
  
  // API connections
  getAllConnections: () => api.get('/brokers/connections/all'),
  getConnection: (id) => api.get(`/brokers/connections/${id}`),
  connect: (data) => api.post('/brokers/connections/connect', data),
  sync: (id) => api.post(`/brokers/connections/${id}/sync`),
  syncAll: () => api.post('/brokers/connections/sync-all'),
  disconnect: (id) => api.delete(`/brokers/connections/${id}`),
};

export default api;