// Module 1: Imports and Initial Setup
import React, { useState, useEffect, useCallback } from 'react';
import {
  Menu,
  X,
  Home,
  TrendingUp,
  Wallet,
  PieChart,
  User,
  LogOut,
  Plus,
  Edit2,
  Trash2,
  Moon,
  ArrowUpCircle,
  ArrowDownCircle,
  Download,
  Camera,
  Target,
  Award,
  DollarSign,
  History,
  LineChart,
  Zap,
  Clock,
  AlertCircle
} from 'lucide-react';

// Import API services
import { 
  authAPI, 
  transactionAPI, 
  investmentAPI, 
  budgetAPI, 
  goalAPI, 
  brokerAPI 
} from 'C:/Users/Admin/celestiq-app/Clients/src/Services/api';
import { initSocket, disconnectSocket, onSocketEvent, offSocketEvent } from 'C:/Users/Admin/celestiq-app/Clients/src/Services/socket';

// Constants
const CURRENCY_SYMBOLS = {
  INR: '₹',
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  AUD: 'A$',
  CAD: 'C$'
};

const DEFAULT_EXPENSE_CATEGORIES = [
  'Food & Dining',
  'Transport',
  'Shopping',
  'Bills',
  'Entertainment',
  'Health',
  'Education',
  'Other'
];

const DEFAULT_INCOME_CATEGORIES = [
  'Salary',
  'Freelance',
  'Business',
  'Investment Returns',
  'Gift',
  'Other'
];

const INVESTMENT_TYPES = [
  'Stocks',
  'Mutual Funds',
  'Bonds',
  'Gold',
  'Real Estate',
  'Crypto',
  'Other'
];

const HEALTH_SCORE_WEIGHTS = {
  SAVINGS_RATE: 50,
  INVESTMENT_RATE: 30,
  BASE_SCORE: 20
};

const BROKER_PLATFORMS = [
  {
    name: 'Robinhood',
    apiSupport: true,
    authType: 'oauth2',
    docs: 'https://robinhood.com/us/en/support/articles/developer-api/'
  },
  {
    name: 'Alpaca',
    apiSupport: true,
    authType: 'api_key',
    docs: 'https://alpaca.markets/docs/'
  },
  {
    name: 'TD Ameritrade',
    apiSupport: true,
    authType: 'oauth2',
    docs: 'https://developer.tdameritrade.com/'
  },
  {
    name: 'Interactive Brokers',
    apiSupport: true,
    authType: 'api_key',
    docs: 'https://www.interactivebrokers.com/en/index.php?f=5041'
  },
  {
    name: 'E*TRADE',
    apiSupport: true,
    authType: 'oauth1',
    docs: 'https://developer.etrade.com/home'
  },
  {
    name: 'Webull',
    apiSupport: false,
    authType: null,
    docs: null
  },
  {
    name: 'Coinbase',
    apiSupport: true,
    authType: 'api_key',
    docs: 'https://developers.coinbase.com/'
  },
  {
    name: 'Binance',
    apiSupport: true,
    authType: 'api_key',
    docs: 'https://binance-docs.github.io/apidocs/'
  },
  {
    name: 'Zerodha (Kite)',
    apiSupport: true,
    authType: 'api_key',
    docs: 'https://kite.trade/'
  },
  {
    name: 'Upstox',
    apiSupport: true,
    authType: 'oauth2',
    docs: 'https://upstox.com/developer/api-documentation/'
  },
  {
    name: 'Manual Entry',
    apiSupport: false,
    authType: null,
    docs: null
  }
];

const STORAGE_KEYS = {
  USER: 'celestiq_user',
  EXPENSES: 'celestiq_expenses',
  INCOME: 'celestiq_income',
  INVESTMENTS: 'celestiq_investments',
  BUDGETS: 'celestiq_budgets',
  GOALS: 'celestiq_goals',
  CATEGORIES: 'celestiq_categories',
  BROKERS: 'celestiq_brokers',
  BROKER_CONNECTIONS: 'celestiq_broker_connections'
};

const API_CONFIG = {
  ALPACA: {
    baseUrl: 'https://paper-api.alpaca.markets',
    version: 'v2',
    endpoints: {
      account: '/v2/account',
      positions: '/v2/positions',
      orders: '/v2/orders',
      assets: '/v2/assets'
    }
  },
  COINBASE: {
    baseUrl: 'https://api.coinbase.com',
    version: 'v2',
    endpoints: {
      accounts: '/v2/accounts',
      transactions: '/v2/accounts/:account_id/transactions'
    }
  },
  ZERODHA: {
    baseUrl: 'https://api.kite.trade',
    endpoints: {
      holdings: '/holdings',
      positions: '/positions',
      orders: '/orders'
    }
  }
};

//Module 2: Helper Functions

// Helper Functions - Updated for Backend Integration
const HelperFunctions = {
  // Calculate financial health score
  calculateHealthScore: (balance, totalIncome, totalInvestments) => {
    if (totalIncome === 0) return 0;
    const savingsRate = (balance / totalIncome) * HEALTH_SCORE_WEIGHTS.SAVINGS_RATE;
    const investmentRate = (totalInvestments / totalIncome) * HEALTH_SCORE_WEIGHTS.INVESTMENT_RATE;
    const score = savingsRate + investmentRate + HEALTH_SCORE_WEIGHTS.BASE_SCORE;
    return Math.min(100, Math.max(0, score)).toFixed(0);
  },

  // Format currency
  formatCurrency: (amount, currency) => {
    return `${CURRENCY_SYMBOLS[currency]}${parseFloat(amount).toFixed(2)}`;
  },

  // Get current date and time
  getCurrentDateTime: () => {
    const now = new Date();
    return {
      date: now.toISOString().split('T')[0],
      time: now.toTimeString().split(' ')[0].substring(0, 5)
    };
  },

  // Validate email
  validateEmail: (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  },

  // Generate unique ID (not needed anymore - backend handles this)
  generateId: () => Date.now() + Math.random().toString(36).substr(2, 9),

  // Token management
  saveToken: (token) => {
    localStorage.setItem('celestiq_token', token);
  },

  getToken: () => {
    return localStorage.getItem('celestiq_token');
  },

  removeToken: () => {
    localStorage.removeItem('celestiq_token');
  },

  // User data
  saveUser: (user) => {
    localStorage.setItem('celestiq_user', JSON.stringify(user));
  },

  getUser: () => {
    const user = localStorage.getItem('celestiq_user');
    return user ? JSON.parse(user) : null;
  },

  removeUser: () => {
    localStorage.removeItem('celestiq_user');
  }
};



//Module 3: Main Component Setup - ALL STATE DECLARATIONS

const CelestiqApp = () => {
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authScreen, setAuthScreen] = useState('login');
  const [showOtpInput, setShowOtpInput] = useState(false);

  // UI state
  const [menuOpen, setMenuOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [showProfile, setShowProfile] = useState(false);

  // Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [editingItem, setEditingItem] = useState(null);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  // User data
  const [user, setUser] = useState({
    name: '',
    email: '',
    darkMode: false,
    currency: 'USD'
  });

  // Form data
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    otp: ''
  });

  // Financial data
  const [expenses, setExpenses] = useState([]);
  const [income, setIncome] = useState([]);
  const [investments, setInvestments] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [savingsGoals, setSavingsGoals] = useState([]);

  // Categories
  const [categories, setCategories] = useState({
    expense: DEFAULT_EXPENSE_CATEGORIES,
    income: DEFAULT_INCOME_CATEGORIES
  });

  // Category management
  const [newCategoryName, setNewCategoryName] = useState('');
  const [categoryTypeToAdd, setCategoryTypeToAdd] = useState('expense');

  // Broker and portfolio tracking
  const [brokers, setBrokers] = useState([]);
  const [showBrokerModal, setShowBrokerModal] = useState(false);
  const [editingBroker, setEditingBroker] = useState(null);
  const [selectedBroker, setSelectedBroker] = useState('all');

  // Broker API connections
  const [brokerConnections, setBrokerConnections] = useState([]);
  const [showConnectBrokerModal, setShowConnectBrokerModal] = useState(false);
  const [selectedBrokerPlatform, setSelectedBrokerPlatform] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState({});
  const [lastSyncTime, setLastSyncTime] = useState(null);

  // Error handling
  const [error, setError] = useState('');

  // Loading states
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  
  // Socket connection
  const [socket, setSocket] = useState(null);
  
  // Sync states for real-time updates
  const [syncingData, setSyncingData] = useState(false);

  //Module 4: useEffect Hooks and Data Persistence

  /// Load user and initialize socket on mount
  useEffect(() => {
    const initializeApp = async () => {
      setDataLoading(true);
      
      const token = HelperFunctions.getToken();
      const savedUser = HelperFunctions.getUser();

      if (token && savedUser) {
        try {
          // Verify token and get updated user data
          const response = await authAPI.getMe();
          
          if (response.data.success) {
            setUser(response.data.data.user);
            setIsAuthenticated(true);
            
            // Initialize socket connection
            const socketInstance = initSocket(response.data.data.user.id);
            setSocket(socketInstance);
            
            // Load all data
            await loadAllData();
          }
        } catch (error) {
          console.error('Auth error:', error);
          // Token invalid, clear and logout
          HelperFunctions.removeToken();
          HelperFunctions.removeUser();
          setIsAuthenticated(false);
        }
      }
      
      setDataLoading(false);
    };

    initializeApp();

    // Cleanup on unmount
    return () => {
      disconnectSocket();
    };
  }, []);

  // Setup socket event listeners
  useEffect(() => {
    if (!socket || !isAuthenticated) return;

    // Transaction events
    onSocketEvent('transaction-added', (data) => {
      setExpenses(prev => data.transaction.type === 'expense' ? [...prev, data.transaction] : prev);
      setIncome(prev => data.transaction.type === 'income' ? [...prev, data.transaction] : prev);
    });

    onSocketEvent('transaction-updated', (data) => {
      if (data.transaction.type === 'expense') {
        setExpenses(prev => prev.map(e => e._id === data.transaction._id ? data.transaction : e));
      } else {
        setIncome(prev => prev.map(i => i._id === data.transaction._id ? data.transaction : i));
      }
    });

    onSocketEvent('transaction-deleted', (data) => {
      setExpenses(prev => prev.filter(e => e._id !== data.id));
      setIncome(prev => prev.filter(i => i._id !== data.id));
    });

    // Investment events
    onSocketEvent('investment-added', (data) => {
      setInvestments(prev => [...prev, data.investment]);
    });

    onSocketEvent('investment-updated', (data) => {
      setInvestments(prev => prev.map(inv => inv._id === data.investment._id ? data.investment : inv));
    });

    onSocketEvent('investment-deleted', (data) => {
      setInvestments(prev => prev.filter(inv => inv._id !== data.id));
    });

    // Budget events
    onSocketEvent('budget-added', (data) => {
      setBudgets(prev => [...prev, data.budget]);
    });

    onSocketEvent('budget-updated', (data) => {
      setBudgets(prev => prev.map(b => b._id === data.budget._id ? data.budget : b));
    });

    onSocketEvent('budget-deleted', (data) => {
      setBudgets(prev => prev.filter(b => b._id !== data.id));
    });

    // Goal events
    onSocketEvent('goal-added', (data) => {
      setSavingsGoals(prev => [...prev, data.goal]);
    });

    onSocketEvent('goal-updated', (data) => {
      setSavingsGoals(prev => prev.map(g => g._id === data.goal._id ? data.goal : g));
      if (data.isCompleted) {
        alert(`🎉 Congratulations! You've achieved your goal: ${data.goal.name}`);
      }
    });

    onSocketEvent('goal-deleted', (data) => {
      setSavingsGoals(prev => prev.filter(g => g._id !== data.id));
    });

    // Broker events
    onSocketEvent('broker-added', (data) => {
      setBrokers(prev => [...prev, data.broker]);
    });

    onSocketEvent('broker-updated', (data) => {
      setBrokers(prev => prev.map(b => b._id === data.broker._id ? data.broker : b));
    });

    onSocketEvent('broker-deleted', (data) => {
      setBrokers(prev => prev.filter(b => b._id !== data.id));
    });

    onSocketEvent('broker-connected', (data) => {
      setBrokerConnections(prev => [...prev, data.connection]);
    });

    onSocketEvent('broker-disconnected', (data) => {
      setBrokerConnections(prev => prev.filter(bc => bc._id !== data.id));
    });

    onSocketEvent('investments-synced', (data) => {
      loadInvestments(); // Reload all investments after sync
    });

    // Cleanup
    return () => {
      offSocketEvent('transaction-added');
      offSocketEvent('transaction-updated');
      offSocketEvent('transaction-deleted');
      offSocketEvent('investment-added');
      offSocketEvent('investment-updated');
      offSocketEvent('investment-deleted');
      offSocketEvent('budget-added');
      offSocketEvent('budget-updated');
      offSocketEvent('budget-deleted');
      offSocketEvent('goal-added');
      offSocketEvent('goal-updated');
      offSocketEvent('goal-deleted');
      offSocketEvent('broker-added');
      offSocketEvent('broker-updated');
      offSocketEvent('broker-deleted');
      offSocketEvent('broker-connected');
      offSocketEvent('broker-disconnected');
      offSocketEvent('investments-synced');
    };
  }, [socket, isAuthenticated]);

  // Dark mode effect
  useEffect(() => {
    if (user.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [user.darkMode]);

  // Clear error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Load all data from backend
  const loadAllData = async () => {
    try {
      setSyncingData(true);
      
      await Promise.all([
        loadTransactions(),
        loadInvestments(),
        loadBudgets(),
        loadGoals(),
        loadBrokers(),
        loadBrokerConnections()
      ]);
      
      setSyncingData(false);
    } catch (error) {
      console.error('Error loading data:', error);
      setSyncingData(false);
      setError('Failed to load data');
    }
  };

  const loadTransactions = async () => {
    try {
      const response = await transactionAPI.getAll();
      if (response.data.success) {
        const transactions = response.data.data.transactions;
        setExpenses(transactions.filter(t => t.type === 'expense'));
        setIncome(transactions.filter(t => t.type === 'income'));
      }
    } catch (error) {
      console.error('Error loading transactions:', error);
    }
  };

  const loadInvestments = async () => {
    try {
      const response = await investmentAPI.getAll();
      if (response.data.success) {
        setInvestments(response.data.data.investments);
      }
    } catch (error) {
      console.error('Error loading investments:', error);
    }
  };

  const loadBudgets = async () => {
    try {
      const response = await budgetAPI.getAll();
      if (response.data.success) {
        setBudgets(response.data.data.budgets);
      }
    } catch (error) {
      console.error('Error loading budgets:', error);
    }
  };

  const loadGoals = async () => {
    try {
      const response = await goalAPI.getAll();
      if (response.data.success) {
        setSavingsGoals(response.data.data.goals);
      }
    } catch (error) {
      console.error('Error loading goals:', error);
    }
  };

  const loadBrokers = async () => {
    try {
      const response = await brokerAPI.getAll();
      if (response.data.success) {
        setBrokers(response.data.data.brokers);
      }
    } catch (error) {
      console.error('Error loading brokers:', error);
    }
  };

  const loadBrokerConnections = async () => {
    try {
      const response = await brokerAPI.getAllConnections();
      if (response.data.success) {
        setBrokerConnections(response.data.data.connections);
      }
    } catch (error) {
      console.error('Error loading broker connections:', error);
    }
  };

  //Module 5: Event Handlers - Authentication and Basic Operations

  // Authentication handler
  // Authentication handler - UPDATED FOR BACKEND
  const handleAuth = useCallback(async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validate email
      if (!HelperFunctions.validateEmail(formData.email)) {
        setError('Please enter a valid email address');
        setLoading(false);
        return;
      }

      // Validate password length
      if (!showOtpInput && formData.password.length < 6) {
        setError('Password must be at least 6 characters');
        setLoading(false);
        return;
      }

      if (authScreen === 'register' && !showOtpInput) {
        // Register and send OTP
        const response = await authAPI.register({
          name: formData.name,
          email: formData.email,
          password: formData.password
        });

        if (response.data.success) {
          setShowOtpInput(true);
          setError('');
          alert('OTP sent to ' + formData.email + '. Please check your email.');
        }
      } else if (authScreen === 'register' && showOtpInput) {
        // Verify OTP
        if (!formData.otp || formData.otp.length !== 6) {
          setError('Please enter a valid 6-digit OTP');
          setLoading(false);
          return;
        }

        const response = await authAPI.verifyOTP({
          email: formData.email,
          otp: formData.otp
        });

        if (response.data.success) {
          const { token, user } = response.data.data;
          
          // Save token and user
          HelperFunctions.saveToken(token);
          HelperFunctions.saveUser(user);
          
          setUser(user);
          setCategories(user.categories);
          setIsAuthenticated(true);
          
          // Initialize socket
          const socketInstance = initSocket(user.id);
          setSocket(socketInstance);
          
          // Load data
          await loadAllData();
          
          setFormData({ email: '', password: '', name: '', otp: '' });
          setShowOtpInput(false);
          setError('');
        }
      } else {
        // Login
        const response = await authAPI.login({
          email: formData.email,
          password: formData.password
        });

        if (response.data.success) {
          const { token, user } = response.data.data;
          
          // Save token and user
          HelperFunctions.saveToken(token);
          HelperFunctions.saveUser(user);
          
          setUser(user);
          setCategories(user.categories);
          setIsAuthenticated(true);
          
          // Initialize socket
          const socketInstance = initSocket(user.id);
          setSocket(socketInstance);
          
          // Load data
          await loadAllData();
          
          setFormData({ email: '', password: '', name: '', otp: '' });
          setError('');
        }
      }
    } catch (error) {
      console.error('Auth error:', error);
      setError(error.response?.data?.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [authScreen, formData, showOtpInput]);

  // Resend OTP handler
  const handleResendOTP = useCallback(async () => {
    setLoading(true);
    try {
      const response = await authAPI.resendOTP({ email: formData.email });
      if (response.data.success) {
        alert('OTP resent successfully! Check your email.');
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  }, [formData.email]);

  // Open add modal
  const openAddModal = useCallback((type) => {
    setModalType(type);
    setEditingItem(null);
    setShowAddModal(true);
    setMenuOpen(false);
    setError('');
  }, []);

  // Handle add item
  const handleAddItem = useCallback(async (item) => {
    setLoading(true);
    try {
      const { date, time } = HelperFunctions.getCurrentDateTime();
      
      const itemData = {
        ...item,
        date: item.date || date,
        time: item.time || time
      };

      if (modalType === 'expense' || modalType === 'income') {
        const response = await transactionAPI.create({
          type: modalType,
          description: itemData.name || itemData.description,
          amount: parseFloat(itemData.amount),
          category: itemData.category,
          date: itemData.date,
          time: itemData.time
        });

        if (response.data.success) {
          const newTransaction = response.data.data.transaction;
          if (modalType === 'expense') {
            setExpenses(prev => [...prev, newTransaction]);
          } else {
            setIncome(prev => [...prev, newTransaction]);
          }
        }
      } else if (modalType === 'investment') {
        const response = await investmentAPI.create({
          name: itemData.name,
          type: itemData.type,
          amount: parseFloat(itemData.amount),
          quantity: itemData.quantity ? parseFloat(itemData.quantity) : null,
          purchasePrice: itemData.purchasePrice ? parseFloat(itemData.purchasePrice) : null,
          currentPrice: itemData.currentPrice ? parseFloat(itemData.currentPrice) : null,
          broker: itemData.brokerId || null,
          date: itemData.date,
          time: itemData.time
        });

        if (response.data.success) {
          setInvestments(prev => [...prev, response.data.data.investment]);
        }
      }

      setShowAddModal(false);
      setError('');
    } catch (error) {
      console.error('Error adding item:', error);
      setError(error.response?.data?.message || 'Failed to add item. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [modalType]);

  // Handle delete item
  const handleDeleteItem = useCallback(async (id, type) => {
    if (!window.confirm('Are you sure you want to delete this item?')) {
      return;
    }

    setLoading(true);
    try {
      if (type === 'expense' || type === 'income') {
        const response = await transactionAPI.delete(id);
        if (response.data.success) {
          if (type === 'expense') {
            setExpenses(prev => prev.filter(e => e._id !== id));
          } else {
            setIncome(prev => prev.filter(i => i._id !== id));
          }
        }
      } else if (type === 'investment') {
        const response = await investmentAPI.delete(id);
        if (response.data.success) {
          setInvestments(prev => prev.filter(inv => inv._id !== id));
        }
      } else if (type === 'budget') {
        const response = await budgetAPI.delete(id);
        if (response.data.success) {
          setBudgets(prev => prev.filter(b => b._id !== id));
        }
      } else if (type === 'goal') {
        const response = await goalAPI.delete(id);
        if (response.data.success) {
          setSavingsGoals(prev => prev.filter(g => g._id !== id));
        }
      }
    } catch (error) {
      console.error('Error deleting item:', error);
      setError(error.response?.data?.message || 'Failed to delete item. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle add budget
  const handleAddBudget = useCallback(async (budget) => {
    setLoading(true);
    try {
      const response = await budgetAPI.create({
        category: budget.category,
        limit: parseFloat(budget.limit),
        period: 'monthly'
      });

      if (response.data.success) {
        setBudgets(prev => [...prev, response.data.data.budget]);
        setShowBudgetModal(false);
        setError('');
      }
    } catch (error) {
      console.error('Error adding budget:', error);
      setError(error.response?.data?.message || 'Failed to add budget. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);


  // Handle add goal
  const handleAddGoal = useCallback(async (goal) => {
    setLoading(true);
    try {
      const response = await goalAPI.create({
        name: goal.name,
        description: goal.description || '',
        target: parseFloat(goal.target),
        progress: 0
      });

      if (response.data.success) {
        setSavingsGoals(prev => [...prev, response.data.data.goal]);
        setShowGoalModal(false);
        setError('');
      }
    } catch (error) {
      console.error('Error adding goal:', error);
      setError(error.response?.data?.message || 'Failed to add goal. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle add category
  const handleAddCategory = useCallback(async () => {
    if (!newCategoryName.trim()) {
      setError('Please enter a category name');
      return;
    }

    const trimmedName = newCategoryName.trim();

    if (categories[categoryTypeToAdd].includes(trimmedName)) {
      setError('Category already exists');
      return;
    }

    setLoading(true);
    try {
      const response = await authAPI.addCategory({
        type: categoryTypeToAdd,
        name: trimmedName
      });

      if (response.data.success) {
        setCategories(response.data.data.categories);
        setNewCategoryName('');
        setError('');
        alert('Category added successfully!');
      }
    } catch (error) {
      console.error('Error adding category:', error);
      setError(error.response?.data?.message || 'Failed to add category');
    } finally {
      setLoading(false);
    }
  }, [newCategoryName, categoryTypeToAdd, categories]);

  // Handle delete category
  const handleDeleteCategory = useCallback(async (category, type) => {
    if (categories[type].length <= 1) {
      setError('Cannot delete the last category!');
      return;
    }

    const defaultCategories = type === 'expense'
      ? DEFAULT_EXPENSE_CATEGORIES
      : DEFAULT_INCOME_CATEGORIES;

    if (defaultCategories.includes(category)) {
      setError('Cannot delete default categories!');
      return;
    }

    if (!window.confirm(`Delete category "${category}"?`)) {
      return;
    }

    setLoading(true);
    try {
      const response = await authAPI.deleteCategory({
        type,
        name: category
      });

      if (response.data.success) {
        setCategories(response.data.data.categories);
        setError('');
        alert('Category deleted successfully!');
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      setError(error.response?.data?.message || 'Failed to delete category');
    } finally {
      setLoading(false);
    }
  }, [categories]);

  // Handle logout
  const handleLogout = useCallback(() => {
    if (window.confirm('Are you sure you want to logout?')) {
      // Clear all data
      HelperFunctions.removeToken();
      HelperFunctions.removeUser();
      
      // Disconnect socket
      disconnectSocket();
      
      // Reset state
      setIsAuthenticated(false);
      setShowProfile(false);
      setUser({ name: '', email: '', darkMode: false, currency: 'USD' });
      setExpenses([]);
      setIncome([]);
      setInvestments([]);
      setBudgets([]);
      setSavingsGoals([]);
      setBrokers([]);
      setBrokerConnections([]);
      setCategories({
        expense: DEFAULT_EXPENSE_CATEGORIES,
        income: DEFAULT_INCOME_CATEGORIES
      });
    }
  }, []);


  //Module 7: Broker Management Handlers

  // Handle add broker
  const handleAddBroker = useCallback(async (broker) => {
    setLoading(true);
    try {
      if (editingBroker) {
        // Update existing broker
        const response = await brokerAPI.update(editingBroker._id, {
          name: broker.name,
          platform: broker.platform,
          accountNumber: broker.accountNumber || null,
          notes: broker.notes || ''
        });

        if (response.data.success) {
          setBrokers(prev => prev.map(b =>
            b._id === editingBroker._id ? response.data.data.broker : b
          ));
        }
      } else {
        // Add new broker
        const response = await brokerAPI.create({
          name: broker.name,
          platform: broker.platform,
          accountNumber: broker.accountNumber || null,
          notes: broker.notes || ''
        });

        if (response.data.success) {
          setBrokers(prev => [...prev, response.data.data.broker]);
        }
      }

      setShowBrokerModal(false);
      setEditingBroker(null);
      setError('');
    } catch (error) {
      console.error('Error saving broker:', error);
      setError(error.response?.data?.message || 'Failed to save broker. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [editingBroker]);

  // Handle delete broker
  const handleDeleteBroker = useCallback(async (brokerId) => {
    if (!window.confirm('Are you sure you want to delete this broker? Associated investments will not be deleted.')) {
      return;
    }

    setLoading(true);
    try {
      const response = await brokerAPI.delete(brokerId);
      
      if (response.data.success) {
        setBrokers(prev => prev.filter(b => b._id !== brokerId));
      }
    } catch (error) {
      console.error('Error deleting broker:', error);
      setError(error.response?.data?.message || 'Failed to delete broker. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle edit broker
  const handleEditBroker = useCallback((broker) => {
    setEditingBroker(broker);
    setShowBrokerModal(true);
  }, []);

  //Module 8: Broker API Connection Handlers

  // Handle connect broker 
  const handleConnectBroker = useCallback(async (connectionData) => {
    setIsSyncing(true);
    setSyncStatus({ status: 'connecting', message: 'Connecting to broker...' });

    try {
      const response = await brokerAPI.connect({
        name: connectionData.name,
        platform: connectionData.platform,
        apiKey: connectionData.apiKey,
        apiSecret: connectionData.apiSecret || null,
        accessToken: connectionData.accessToken || null,
        brokerId: connectionData.brokerId || null
      });

      if (response.data.success) {
        setBrokerConnections(prev => [...prev, response.data.data.connection]);
        
        // Reload investments to get synced data
        await loadInvestments();
        
        setSyncStatus({ status: 'success', message: 'Broker connected successfully!' });
        setShowConnectBrokerModal(false);
        setSelectedBrokerPlatform(null);
        setError('');
        
        setTimeout(() => setSyncStatus({}), 3000);
      }
    } catch (error) {
      console.error('Connection Error:', error);
      setSyncStatus({ status: 'error', message: error.response?.data?.message || error.message });
      setError('Failed to connect to broker: ' + (error.response?.data?.message || error.message));
      setTimeout(() => setSyncStatus({}), 5000);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  // Handle sync broker
  const handleSyncBroker = useCallback(async (connection) => {
    setIsSyncing(true);
    setSyncStatus({ status: 'syncing', message: `Syncing ${connection.name}...` });

    try {
      const response = await brokerAPI.sync(connection._id);

      if (response.data.success) {
        // Reload investments
        await loadInvestments();
        
        // Update connection in state
        setBrokerConnections(prev => prev.map(bc =>
          bc._id === connection._id
            ? { ...bc, lastSync: new Date().toISOString() }
            : bc
        ));

        setLastSyncTime(new Date().toISOString());
        setSyncStatus({ status: 'success', message: 'Sync completed!' });
        
        setTimeout(() => setSyncStatus({}), 3000);
      }
    } catch (error) {
      console.error('Sync Error:', error);
      setSyncStatus({ status: 'error', message: 'Sync failed: ' + (error.response?.data?.message || error.message) });
      setError('Failed to sync investments: ' + (error.response?.data?.message || error.message));
      setTimeout(() => setSyncStatus({}), 5000);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  // Handle sync all brokers
  const handleSyncAllBrokers = useCallback(async () => {
    if (brokerConnections.length === 0) return;

    setIsSyncing(true);
    setSyncStatus({ status: 'syncing', message: 'Syncing all brokers...' });

    try {
      const response = await brokerAPI.syncAll();

      if (response.data.success) {
        // Reload all investments
        await loadInvestments();
        
        // Reload broker connections to get updated lastSync
        await loadBrokerConnections();

        setSyncStatus({ status: 'success', message: 'All brokers synced!' });
        setTimeout(() => setSyncStatus({}), 3000);
      }
    } catch (error) {
      console.error('Sync All Error:', error);
      setSyncStatus({ status: 'error', message: 'Some syncs failed' });
      setTimeout(() => setSyncStatus({}), 5000);
    } finally {
      setIsSyncing(false);
    }
  }, [brokerConnections]);

  // Handle disconnect broker
  const handleDisconnectBroker = useCallback(async (connectionId) => {
    if (!window.confirm('Disconnect this broker? Synced investments will be removed.')) {
      return;
    }

    setLoading(true);
    try {
      const response = await brokerAPI.disconnect(connectionId);

      if (response.data.success) {
        // Remove connection from state
        setBrokerConnections(prev => prev.filter(bc => bc._id !== connectionId));
        
        // Remove synced investments
        setInvestments(prev => prev.filter(inv => inv.brokerConnection?._id !== connectionId));
      }
    } catch (error) {
      console.error('Disconnect Error:', error);
      setError(error.response?.data?.message || 'Failed to disconnect broker');
    } finally {
      setLoading(false);
    }
  }, []);


  //Module 9: Calculated Values and Helper Functions

  // Calculated values 
  const totalExpenses = expenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
  const totalIncome = income.reduce((sum, i) => sum + parseFloat(i.amount || 0), 0);
  const totalInvestments = investments.reduce((sum, inv) => sum + parseFloat(inv.amount || 0), 0);
  const balance = totalIncome - totalExpenses;
  const financialHealthScore = HelperFunctions.calculateHealthScore(
    balance,
    totalIncome,
    totalInvestments
  );

  // Broker and investment calculations
 const getInvestmentsByBroker = useCallback((brokerId) => {
  if (brokerId === 'all') return investments;
  return investments.filter(inv => {
    // Check both manual broker and API connection
    return (inv.broker?._id === brokerId) || (inv.broker === brokerId);
  });
}, [investments]);

  const getBrokerValue = useCallback((brokerId) => {
    return getInvestmentsByBroker(brokerId)
      .reduce((sum, inv) => sum + parseFloat(inv.amount || 0), 0);
  }, [getInvestmentsByBroker]);

  const calculatePortfolioStats = useCallback(() => {
    const stats = {
      totalValue: totalInvestments,
      totalGainLoss: 0,
      totalGainLossPercent: 0,
      bestPerformer: null,
      worstPerformer: null
    };

    const investmentsWithGains = investments
      .filter(inv => inv.purchasePrice && inv.currentPrice && inv.quantity)
      .map(inv => {
        const quantity = parseFloat(inv.quantity);
        const purchase = parseFloat(inv.purchasePrice);
        const current = parseFloat(inv.currentPrice);
        const invested = purchase * quantity;
        const currentValue = current * quantity;
        const gainLoss = currentValue - invested;
        const gainLossPercent = (gainLoss / invested) * 100;

        return {
          ...inv,
          invested,
          currentValue,
          gainLoss,
          gainLossPercent
        };
      });

    if (investmentsWithGains.length > 0) {
      stats.totalGainLoss = investmentsWithGains.reduce((sum, inv) => sum + inv.gainLoss, 0);
      const totalInvested = investmentsWithGains.reduce((sum, inv) => sum + inv.invested, 0);
      stats.totalGainLossPercent = totalInvested > 0 ? (stats.totalGainLoss / totalInvested) * 100 : 0;

      const sorted = [...investmentsWithGains].sort((a, b) => b.gainLossPercent - a.gainLossPercent);
      stats.bestPerformer = sorted[0];
      stats.worstPerformer = sorted[sorted.length - 1];
    }

    return stats;
  }, [investments, totalInvestments]);

  const portfolioStats = calculatePortfolioStats();

  // Module 10: Login/Register Screen

  // Loading screen
  if (dataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center animate-pulse">
            <Wallet size={40} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Celestiq
          </h2>
          <p className="text-gray-600">Loading your financial data...</p>
        </div>
      </div>
    );
  }

  // Login/Register screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-20"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-20"></div>
        </div>

        <div className="relative w-full max-w-md p-8 rounded-3xl backdrop-blur-xl shadow-2xl border bg-white/80 border-white/20">
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center transform rotate-12">
              <Wallet size={32} className="text-white transform -rotate-12" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">Celestiq</h1>
            <p className="text-sm text-gray-600 mt-2">Your Intelligent Finance Companion</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-xl flex items-center gap-2">
              <AlertCircle size={18} />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-4">
            {authScreen === 'register' && (
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border bg-white/50 border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent backdrop-blur-sm transition"
                  placeholder="Enter your name"
                  minLength={2}
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">Email</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border bg-white/50 border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent backdrop-blur-sm transition"
                placeholder="Enter your email"
              />
            </div>

            {!showOtpInput && (
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">Password</label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border bg-white/50 border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent backdrop-blur-sm transition"
                  placeholder="Enter your password"
                  minLength={6}
                />
                <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
              </div>
            )}

            {showOtpInput && (
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">OTP</label>
                  <input
                    type="text"
                    required
                    value={formData.otp}
                    onChange={(e) => setFormData({ ...formData, otp: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                    className="w-full px-4 py-3 rounded-xl border bg-white/50 border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent backdrop-blur-sm transition"
                    placeholder="Enter 6-digit OTP"
                    maxLength={6}
                  />
                  <div className="flex justify-between items-center mt-2">
                    <p className="text-xs text-gray-500">Check your email for the code</p>
                    <button
                      type="button"
                      onClick={handleResendOTP}
                      disabled={loading}
                      className="text-xs text-purple-600 hover:text-purple-700 disabled:opacity-50"
                    >
                      Resend OTP
                    </button>
                  </div>
                </div>
              )}
          </form>

          <div className="mt-6 text-center">
           <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white py-3 rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Clock size={18} className="animate-spin" />
                    Processing...
                  </span>
                ) : (
                  authScreen === 'register' && !showOtpInput ? 'Send OTP' : 
                  authScreen === 'register' ? 'Register' : 'Login'
                )}
              </button>
          </div>
        </div>
      </div>
    );
  }

  // Module 11: Header and Navigation

  // Main app layout
  return (
    <div className={`min-h-screen ${user.darkMode ? 'bg-gray-900 text-white' : 'bg-gradient-to-br from-gray-50 to-blue-50 text-gray-900'}`}>
      <header className={`${user.darkMode ? 'bg-gray-800/95 border-gray-700' : 'bg-white/95 border-gray-200'} border-b sticky top-0 z-50 backdrop-blur-lg shadow-sm`}>
        <div className="flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition"
              aria-label="Toggle menu"
            >
              {menuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Wallet size={20} className="text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Celestiq</h1>
                <p className="text-xs text-gray-500">Smart Finance</p>
              </div>
            </div>
          </div>
          <button
            onClick={() => setShowProfile(!showProfile)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition"
            aria-label="Toggle profile"
          >
            <User size={24} />
          </button>
        </div>
      </header>

      {/* Error notification */}
      {error && (
        <div className="fixed top-20 right-4 z-50 animate-slide-in">
          <div className="bg-red-500 text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-2">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Side menu */}
      {menuOpen && (
        <div className={`fixed inset-0 z-40 ${user.darkMode ? 'bg-gray-800/95' : 'bg-white/95'} backdrop-blur-lg p-6 overflow-y-auto`}>
          <button
            onClick={() => setMenuOpen(false)}
            className="absolute top-4 right-4 p-2"
            aria-label="Close menu"
          >
            <X size={24} />
          </button>
          <nav className="mt-16 space-y-2">
            {[
              { icon: Home, label: 'Dashboard', page: 'dashboard' },
              { icon: TrendingUp, label: 'Portfolio Overview', page: 'portfolio-overview' },
              { icon: LineChart, label: 'Investment Analytics', page: 'invest-analytics' },
              { icon: Wallet, label: 'Broker Accounts', page: 'brokers' },
              { icon: Target, label: 'Budget Goals', page: 'budgets' },
              { icon: Award, label: 'Savings Goals', page: 'savings' },
              { icon: History, label: 'Expense History', page: 'expense-history' },
              { icon: History, label: 'Income History', page: 'income-history' },
              { icon: History, label: 'Investment History', page: 'investment-history' },
            ].map((item) => (
              <button
                key={item.page}
                onClick={() => {
                  setCurrentPage(item.page);
                  setMenuOpen(false);
                  setError('');
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${
                  currentPage === item.page
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <item.icon size={20} />
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700 mt-4">
              <p className="text-xs font-semibold text-gray-500 px-4 mb-2">SETTINGS</p>
              <button
                onClick={() => {
                  setShowCategoryModal(true);
                  setMenuOpen(false);
                  setError('');
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              >
                <Plus size={20} />
                <span>Manage Categories</span>
              </button>
              <button
                onClick={() => {
                  alert('Export feature coming soon!');
                  setMenuOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              >
                <Download size={20} className="text-green-500" />
                <span>Export Data</span>
              </button>
            </div>
          </nav>
        </div>
      )}

      {/*Module 12: Profile Dropdown*/}

      {/* Profile dropdown */}
      {showProfile && (
        <div className={`absolute right-4 top-16 ${user.darkMode ? 'bg-gray-800/95' : 'bg-white/95'} border rounded-2xl backdrop-blur-lg shadow-xl p-4 w-72 z-50`}>
          <div className="mb-4 pb-4 border-b">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">{(user.name || 'U')[0].toUpperCase()}</span>
              </div>
              <div>
                <p className="font-semibold">{user.name || 'User'}</p>
                <p className="text-sm text-gray-500">{user.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-3">
              <Zap size={16} className="text-yellow-500" />
              <div className="flex-1">
                <div className="flex justify-between text-xs mb-1">
                  <span>Health Score</span>
                  <span className="font-bold">{financialHealthScore}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      financialHealthScore > 70
                        ? 'bg-green-500'
                        : financialHealthScore > 40
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                    }`}
                    style={{ width: financialHealthScore + '%' }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Dark Mode</span>
              <button
                onClick={() => setUser({ ...user, darkMode: !user.darkMode })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${user.darkMode ? 'bg-purple-600' : 'bg-gray-300'}`}
                aria-label="Toggle dark mode"
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${user.darkMode ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Currency</span>
              <select
                value={user.currency}
                onChange={(e) => setUser({ ...user, currency: e.target.value })}
                className={`px-3 py-1 rounded-lg border text-sm ${user.darkMode ? 'bg-gray-700' : 'bg-white'}`}
              >
                {Object.keys(CURRENCY_SYMBOLS).map(currency => (
                  <option key={currency} value={currency}>{currency}</option>
                ))}
              </select>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-xl hover:shadow-lg transition"
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      )}

      <main className="p-4 max-w-7xl mx-auto pb-20">

        {/*Module 13: Dashboard Page (Part 1)*/}

        {/* Dashboard page */}
        {currentPage === 'dashboard' && (
          <div className="space-y-10">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-4xl font-bold">Dashboard</h2>
                <p className="text-gray-500 mt-1">Welcome back, {user.name || 'User'}! Here's your financial overview</p>
              </div>
            </div>

            {/* Quick Add Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => openAddModal('expense')}
                className="flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-r from-red-500 to-pink-600 text-white hover:shadow-xl transition-all hover:scale-105"
              >
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <ArrowDownCircle size={24} />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-lg">Add Expense</p>
                  <p className="text-sm opacity-90">Track your spending</p>
                </div>
              </button>

              <button
                onClick={() => openAddModal('income')}
                className="flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:shadow-xl transition-all hover:scale-105"
              >
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <ArrowUpCircle size={24} />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-lg">Add Income</p>
                  <p className="text-sm opacity-90">Record earnings</p>
                </div>
              </button>

              <button
                onClick={() => openAddModal('investment')}
                className="flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-r from-purple-500 to-indigo-600 text-white hover:shadow-xl transition-all hover:scale-105"
              >
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <TrendingUp size={24} />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-lg">Add Investment</p>
                  <p className="text-sm opacity-90">Track portfolio</p>
                </div>
              </button>
            </div>

            {/* Financial Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  label: 'Total Income',
                  value: totalIncome,
                  icon: ArrowUpCircle,
                  color: 'from-green-500 to-emerald-600',
                  textColor: 'text-green-500'
                },
                {
                  label: 'Total Expenses',
                  value: totalExpenses,
                  icon: ArrowDownCircle,
                  color: 'from-red-500 to-pink-600',
                  textColor: 'text-red-500'
                },
                {
                  label: 'Balance',
                  value: balance,
                  icon: Wallet,
                  color: 'from-blue-500 to-cyan-600',
                  textColor: balance >= 0 ? 'text-blue-500' : 'text-red-500'
                },
                {
                  label: 'Investments',
                  value: totalInvestments,
                  icon: TrendingUp,
                  color: 'from-purple-500 to-pink-600',
                  textColor: 'text-purple-500'
                },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className={`p-6 rounded-2xl ${user.darkMode ? 'bg-gray-800/50' : 'bg-white/80'} backdrop-blur-lg shadow-lg border ${user.darkMode ? 'border-gray-700' : 'border-white/20'} hover:shadow-xl transition-all hover:scale-105`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-gray-500">{item.label}</span>
                    <div className={`p-2 bg-gradient-to-br ${item.color} rounded-xl`}>
                      <item.icon size={18} className="text-white" />
                    </div>
                  </div>
                  <p className={`text-3xl font-bold ${item.textColor}`}>
                    {HelperFunctions.formatCurrency(item.value, user.currency)}
                  </p>
                </div>
              ))}
            </div>
            
            {/*Module 14: Dashboard Page (Part 2) - Financial Health Score*/}

            {/* Financial Health Score */}
            <div className={`p-6 rounded-2xl ${user.darkMode ? 'bg-gray-800/50' : 'bg-white/80'} backdrop-blur-lg shadow-lg`}>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Zap size={20} className="text-yellow-500" />
                Financial Health Score
              </h3>
              <div className="flex items-center gap-6">
                <div className="relative w-32 h-32">
                  <svg className="transform -rotate-90 w-32 h-32">
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="transparent"
                      className="text-gray-300 dark:text-gray-700"
                    />
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="transparent"
                      strokeDasharray={2 * Math.PI * 56}
                      strokeDashoffset={2 * Math.PI * 56 * (1 - financialHealthScore / 100)}
                      className={`${
                        financialHealthScore > 70
                          ? 'text-green-500'
                          : financialHealthScore > 40
                          ? 'text-yellow-500'
                          : 'text-red-500'
                      } transition-all duration-1000`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-3xl font-bold">{financialHealthScore}%</span>
                  </div>
                </div>
                <div className="flex-1">
                  <p className={`text-lg font-semibold mb-2 ${
                    financialHealthScore > 70
                      ? 'text-green-500'
                      : financialHealthScore > 40
                      ? 'text-yellow-500'
                      : 'text-red-500'
                  }`}>
                    {financialHealthScore > 70 ? 'Excellent!' : financialHealthScore > 40 ? 'Good' : 'Needs Improvement'}
                  </p>
                  <p className="text-sm text-gray-500 mb-4">Based on income, expenses, and savings</p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Savings Rate</span>
                      <span className="font-semibold">
                        {totalIncome > 0 ? ((balance / totalIncome) * 100).toFixed(1) : 0}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Investment Rate</span>
                      <span className="font-semibold">
                        {totalIncome > 0 ? ((totalInvestments / totalIncome) * 100).toFixed(1) : 0}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/*Module 15: Portfolio Overview Page*/}

        {/* Portfolio Overview Page */}
        {currentPage === 'portfolio-overview' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-bold flex items-center gap-3">
                <TrendingUp size={32} className="text-blue-500" />
                Portfolio Overview
              </h2>
              <button
                onClick={() => openAddModal('investment')}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:shadow-lg transition"
              >
                <Plus size={20} />
                Add Investment
              </button>
            </div>

            {/* Portfolio Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className={`p-6 rounded-2xl ${user.darkMode ? 'bg-gray-800/50' : 'bg-white/80'} backdrop-blur-lg shadow-lg`}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-gray-500">Total Value</span>
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl">
                    <DollarSign size={18} className="text-white" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-blue-500">
                  {HelperFunctions.formatCurrency(portfolioStats.totalValue, user.currency)}
                </p>
              </div>

              <div className={`p-6 rounded-2xl ${user.darkMode ? 'bg-gray-800/50' : 'bg-white/80'} backdrop-blur-lg shadow-lg`}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-gray-500">Total Gain/Loss</span>
                  <div className={`p-2 bg-gradient-to-br ${portfolioStats.totalGainLoss >= 0 ? 'from-green-500 to-emerald-600' : 'from-red-500 to-pink-600'} rounded-xl`}>
                    {portfolioStats.totalGainLoss >= 0 ? <ArrowUpCircle size={18} className="text-white" /> : <ArrowDownCircle size={18} className="text-white" />}
                  </div>
                </div>
                <p className={`text-3xl font-bold ${portfolioStats.totalGainLoss >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {portfolioStats.totalGainLoss >= 0 ? '+' : ''}{HelperFunctions.formatCurrency(portfolioStats.totalGainLoss, user.currency)}
                </p>
                <p className={`text-sm mt-1 ${portfolioStats.totalGainLoss >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {portfolioStats.totalGainLossPercent >= 0 ? '+' : ''}{portfolioStats.totalGainLossPercent.toFixed(2)}%
                </p>
              </div>

              <div className={`p-6 rounded-2xl ${user.darkMode ? 'bg-gray-800/50' : 'bg-white/80'} backdrop-blur-lg shadow-lg`}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-gray-500">Best Performer</span>
                  <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl">
                    <Award size={18} className="text-white" />
                  </div>
                </div>
                <p className="text-xl font-bold text-green-500">
                  {portfolioStats.bestPerformer ? portfolioStats.bestPerformer.name : 'N/A'}
                </p>
                {portfolioStats.bestPerformer && (
                  <p className="text-sm text-green-500 mt-1">
                    +{portfolioStats.bestPerformer.gainLossPercent.toFixed(2)}%
                  </p>
                )}
              </div>

              <div className={`p-6 rounded-2xl ${user.darkMode ? 'bg-gray-800/50' : 'bg-white/80'} backdrop-blur-lg shadow-lg`}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-gray-500">Total Brokers</span>
                  <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl">
                    <Wallet size={18} className="text-white" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-purple-500">{brokers.length}</p>
              </div>
            </div>

            {/* Broker Breakdown */}
            <div className={`p-6 rounded-2xl ${user.darkMode ? 'bg-gray-800/50' : 'bg-white/80'} backdrop-blur-lg shadow-lg`}>
              <h3 className="text-lg font-semibold mb-4">Assets by Broker</h3>
              {brokers.length === 0 ? (
                <div className="text-center py-12">
                  <Wallet size={64} className="mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-500 mb-4">No brokers added yet</p>
                  <button
                    onClick={() => setShowBrokerModal(true)}
                    className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:shadow-lg transition"
                  >
                    Add Your First Broker
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {brokers.map(broker => {
                    const brokerValue = getBrokerValue(broker._id || broker.id);
                    const brokerInvestments = getInvestmentsByBroker(broker._id || broker.id);
                    const percentage = totalInvestments > 0 ? ((brokerValue / totalInvestments) * 100).toFixed(1) : 0;

                    return (
                      <div key={broker.id} className={`p-4 rounded-xl ${user.darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                        <div className="flex justify-between items-center mb-2">
                          <div>
                            <h4 className="font-semibold">{broker.name}</h4>
                            <p className="text-sm text-gray-500">{broker.platform} • {brokerInvestments.length} assets</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-bold text-blue-500">
                              {HelperFunctions.formatCurrency(brokerValue, user.currency)}
                            </p>
                            <p className="text-sm text-gray-500">{percentage}%</p>
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                          <div
                            className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-500"
                            style={{ width: percentage + '%' }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Top Holdings */}
            <div className={`p-6 rounded-2xl ${user.darkMode ? 'bg-gray-800/50' : 'bg-white/80'} backdrop-blur-lg shadow-lg`}>
              <h3 className="text-lg font-semibold mb-4">Top Holdings</h3>
              {investments.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No investments yet</p>
              ) : (
                <div className="space-y-3">
                  {investments
                    .sort((a, b) => parseFloat(b.amount) - parseFloat(a.amount))
                    .slice(0, 5)
                    .map(inv => {
                      const broker = brokers.find(b => (b._id === inv.broker?._id) || (b._id === inv.broker));
                      const percentage = totalInvestments > 0 ? ((parseFloat(inv.amount) / totalInvestments) * 100).toFixed(1) : 0;

                      return (
                        <div key={inv.id} className={`flex items-center justify-between p-3 rounded-xl ${user.darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                          <div>
                            <p className="font-medium">{inv.name}</p>
                            <p className="text-sm text-gray-500">
                              {inv.type} {broker && `• ${broker.name}`}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-purple-500">
                              {HelperFunctions.formatCurrency(inv.amount, user.currency)}
                            </p>
                            <p className="text-sm text-gray-500">{percentage}%</p>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </div>
        )}

        {/*Module 16: Broker Accounts Page (Part 1)*/}

        {/* Broker Accounts Page */}
        {currentPage === 'brokers' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-bold flex items-center gap-3">
                <Wallet size={32} className="text-indigo-500" />
                Broker Accounts
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowConnectBrokerModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-xl hover:shadow-lg transition"
                >
                  <Zap size={20} />
                  Connect API
                </button>
                <button
                  onClick={() => {
                    setEditingBroker(null);
                    setShowBrokerModal(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl hover:shadow-lg transition"
                >
                  <Plus size={20} />
                  Add Manual
                </button>
              </div>
            </div>

            {/* Sync Status Banner */}
            {brokerConnections.length > 0 && (
              <div className={`p-4 rounded-xl ${user.darkMode ? 'bg-gray-800/50' : 'bg-white/80'} backdrop-blur-lg shadow-lg`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${isSyncing ? 'bg-blue-500 animate-pulse' : 'bg-green-500'}`}></div>
                    <div>
                      <p className="font-medium">
                        {isSyncing ? 'Syncing...' : `${brokerConnections.length} broker(s) connected`}
                      </p>
                      {lastSyncTime && (
                        <p className="text-xs text-gray-500">
                          Last synced: {new Date(lastSyncTime).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={handleSyncAllBrokers}
                    disabled={isSyncing}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:shadow-lg transition disabled:opacity-50"
                  >
                    <Download size={18} className={isSyncing ? 'animate-spin' : ''} />
                    Sync All
                  </button>
                </div>
              </div>
            )}

            {/* API Connected Brokers */}
            {brokerConnections.length > 0 && (
              <div>
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Zap size={20} className="text-blue-500" />
                  API Connected Brokers
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {brokerConnections.map(connection => {
                    const linkedBroker = brokers.find(b => b.id === connection.brokerId);
                    const connectedInvestments = investments.filter(inv =>
                      inv.brokerConnectionId === connection.id
                    );
                    const totalValue = connectedInvestments.reduce((sum, inv) =>
                      sum + parseFloat(inv.amount), 0
                    );

                    return (
                      <div
                        key={connection.id}
                        className={`p-6 rounded-2xl ${user.darkMode ? 'bg-gray-800/50' : 'bg-white/80'} backdrop-blur-lg shadow-lg border-2 border-blue-500`}
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                            <div>
                              <h3 className="font-semibold text-xl">{connection.name}</h3>
                              <p className="text-sm text-gray-500">{connection.platform}</p>
                              {linkedBroker && (
                                <p className="text-xs text-blue-500">→ {linkedBroker.name}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleSyncBroker(connection)}
                              disabled={isSyncing}
                              className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition disabled:opacity-50"
                              title="Sync now"
                            >
                              <Download size={16} className={`text-blue-500 ${isSyncing ? 'animate-spin' : ''}`} />
                            </button>
                            <button
                              onClick={() => handleDisconnectBroker(connection.id)}
                              className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition"
                              title="Disconnect"
                            >
                              <Trash2 size={16} className="text-red-500" />
                            </button>
                          </div>
                        </div>

                        <div className="mb-4">
                          <p className="text-sm text-gray-500 mb-1">Synced Value</p>
                          <p className="text-3xl font-bold text-blue-500">
                            {HelperFunctions.formatCurrency(totalValue, user.currency)}
                          </p>
                        </div>

                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-500">Assets</span>
                            <span className="font-semibold">{connectedInvestments.length}</span>
                          </div>
                          {connection.lastSync && (
                            <div className="flex justify-between">
                              <span className="text-gray-500">Last Sync</span>
                              <span className="font-mono text-xs">
                                {new Date(connection.lastSync).toLocaleTimeString()}
                              </span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span className="text-gray-500">Status</span>
                            <span className="text-green-500 font-semibold">● Active</span>
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            setSelectedBroker(connection.id);
                            setCurrentPage('investment-history');
                          }}
                          className="w-full mt-4 px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-xl hover:shadow-lg transition text-sm"
                        >
                          View Synced Assets
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/*Module 17: Broker Accounts Page (Part 2) - Manual Brokers*/}

            {/* Manual Broker Accounts */}
            {brokers.length === 0 && brokerConnections.length === 0 ? (
              <div className={`p-12 rounded-2xl ${user.darkMode ? 'bg-gray-800/50' : 'bg-white/80'} backdrop-blur-lg shadow-lg text-center`}>
                <Wallet size={64} className="mx-auto mb-4 text-gray-400" />
                <h3 className="text-xl font-semibold mb-2">No Broker Accounts</h3>
                <p className="text-gray-500 mb-6">Connect your broker via API for automatic syncing, or add accounts manually</p>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={() => setShowConnectBrokerModal(true)}
                    className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-xl hover:shadow-lg transition"
                  >
                    <Zap size={20} className="inline mr-2" />
                    Connect API
                  </button>
                  <button
                    onClick={() => setShowBrokerModal(true)}
                    className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl hover:shadow-lg transition"
                  >
                    Add Manual Account
                  </button>
                </div>
              </div>
            ) : brokers.length > 0 && (
              <div>
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Edit2 size={20} className="text-indigo-500" />
                  Manual Broker Accounts
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {brokers.map(broker => {
                    const brokerValue = getBrokerValue(broker.id);
                    const brokerInvestments = getInvestmentsByBroker(broker.id).filter(inv => !inv.synced);

                    return (
                      <div
                        key={broker.id}
                        className={`p-6 rounded-2xl ${user.darkMode ? 'bg-gray-800/50' : 'bg-white/80'} backdrop-blur-lg shadow-lg border ${user.darkMode ? 'border-gray-700' : 'border-white/20'}`}
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="font-semibold text-xl">{broker.name}</h3>
                            <p className="text-sm text-gray-500">{broker.platform}</p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditBroker(broker)}
                              className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition"
                              aria-label="Edit broker"
                            >
                              <Edit2 size={16} className="text-blue-500" />
                            </button>
                            <button
                              onClick={() => handleDeleteBroker(broker.id)}
                              className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition"
                              aria-label="Delete broker"
                            >
                              <Trash2 size={16} className="text-red-500" />
                            </button>
                          </div>
                        </div>

                        <div className="mb-4">
                          <p className="text-sm text-gray-500 mb-1">Total Value</p>
                          <p className="text-3xl font-bold text-indigo-500">
                            {HelperFunctions.formatCurrency(brokerValue, user.currency)}
                          </p>
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Manual Assets</span>
                            <span className="font-semibold">{brokerInvestments.length}</span>
                          </div>
                          {broker.accountNumber && (
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-500">Account</span>
                              <span className="font-mono">*{broker.accountNumber.slice(-4)}</span>
                            </div>
                          )}
                        </div>

                        <button
                          onClick={() => {
                            setSelectedBroker(broker.id);
                            setCurrentPage('investment-history');
                          }}
                          className="w-full mt-4 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl hover:shadow-lg transition text-sm"
                        >
                          View Assets
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/*Module 18: Investment Analytics Page (Part 1)*/}

        {/* Investment Analytics Page */}
        {currentPage === 'invest-analytics' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-bold flex items-center gap-3">
                <LineChart size={32} className="text-purple-500" />
                Investment Analytics
              </h2>
              {brokerConnections.length > 0 && (
                <button
                  onClick={handleSyncAllBrokers}
                  disabled={isSyncing}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:shadow-lg transition disabled:opacity-50"
                >
                  <Download size={18} className={isSyncing ? 'animate-spin' : ''} />
                  {isSyncing ? 'Syncing...' : 'Sync Now'}
                </button>
              )}
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                {
                  label: 'Total Portfolio Value',
                  value: HelperFunctions.formatCurrency(totalInvestments, user.currency),
                  icon: DollarSign,
                  color: 'from-blue-500 to-cyan-600',
                  isText: true
                },
                {
                  label: 'Total Assets',
                  value: investments.length,
                  icon: TrendingUp,
                  color: 'from-purple-500 to-pink-600',
                  isCount: true
                },
                {
                  label: 'Total Gain/Loss',
                  value: portfolioStats.totalGainLoss,
                  subValue: `${portfolioStats.totalGainLossPercent >= 0 ? '+' : ''}${portfolioStats.totalGainLossPercent.toFixed(2)}%`,
                  icon: portfolioStats.totalGainLoss >= 0 ? ArrowUpCircle : ArrowDownCircle,
                  color: portfolioStats.totalGainLoss >= 0 ? 'from-green-500 to-emerald-600' : 'from-red-500 to-pink-600',
                  textColor: portfolioStats.totalGainLoss >= 0 ? 'text-green-500' : 'text-red-500',
                  isGainLoss: true
                },
                {
                  label: 'Best Performer',
                  value: portfolioStats.bestPerformer?.name || 'N/A',
                  subValue: portfolioStats.bestPerformer ? `+${portfolioStats.bestPerformer.gainLossPercent.toFixed(2)}%` : '',
                  icon: Award,
                  color: 'from-yellow-500 to-orange-600',
                  isText: true
                },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className={`p-6 rounded-2xl ${user.darkMode ? 'bg-gray-800/50' : 'bg-white/80'} backdrop-blur-lg shadow-lg hover:scale-105 transition-transform`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-gray-500">{item.label}</span>
                    <div className={`p-2 bg-gradient-to-br ${item.color} rounded-xl`}>
                      <item.icon size={18} className="text-white" />
                    </div>
                  </div>
                  <p className={`text-3xl font-bold ${item.textColor || 'text-purple-500'}`}>
                    {item.isText
                      ? item.value
                      : item.isCount
                      ? item.value
                      : item.isGainLoss
                      ? (item.value >= 0 ? '+' : '') + HelperFunctions.formatCurrency(item.value, user.currency)
                      : item.value
                    }
                  </p>
                  {item.subValue && (
                    <p className={`text-sm mt-1 ${item.textColor || 'text-green-500'}`}>{item.subValue}</p>
                  )}
                </div>
              ))}
            </div>

            {/* Synced vs Manual Breakdown */}
            {brokerConnections.length > 0 && (
              <div className={`p-6 rounded-2xl ${user.darkMode ? 'bg-gray-800/50' : 'bg-white/80'} backdrop-blur-lg shadow-lg`}>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Zap size={20} className="text-blue-500" />
                  Synced vs Manual Assets
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-gray-500 mb-2">API Synced Assets</p>
                    <p className="text-2xl font-bold text-blue-500">
                      {investments.filter(inv => inv.synced).length} assets
                    </p>
                    <p className="text-lg text-gray-600">
                      {HelperFunctions.formatCurrency(
                        investments.filter(inv => inv.synced).reduce((sum, inv) => sum + parseFloat(inv.amount), 0),
                        user.currency
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-2">Manual Entries</p>
                    <p className="text-2xl font-bold text-indigo-500">
                      {investments.filter(inv => !inv.synced).length} assets
                    </p>
                    <p className="text-lg text-gray-600">
                      {HelperFunctions.formatCurrency(
                        investments.filter(inv => !inv.synced).reduce((sum, inv) => sum + parseFloat(inv.amount), 0),
                        user.currency
                      )}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Performance Overview */}
            {portfolioStats.totalGainLoss !== 0 && (
              <div className={`p-6 rounded-2xl ${user.darkMode ? 'bg-gray-800/50' : 'bg-white/80'} backdrop-blur-lg shadow-lg`}>
                <h3 className="text-lg font-semibold mb-4">Performance Overview</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10">
                    <p className="text-sm text-gray-500 mb-1">Total Gain/Loss</p>
                    <p className={`text-3xl font-bold ${portfolioStats.totalGainLoss >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {portfolioStats.totalGainLoss >= 0 ? '+' : ''}
                      {HelperFunctions.formatCurrency(portfolioStats.totalGainLoss, user.currency)}
                    </p>
                  </div>
                  <div className="text-center p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10">
                    <p className="text-sm text-gray-500 mb-1">Return %</p>
                    <p className={`text-3xl font-bold ${portfolioStats.totalGainLossPercent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {portfolioStats.totalGainLossPercent >= 0 ? '+' : ''}
                      {portfolioStats.totalGainLossPercent.toFixed(2)}%
                    </p>
                  </div>
                  <div className="text-center p-4 rounded-xl bg-gradient-to-br from-red-500/10 to-pink-500/10">
                    <p className="text-sm text-gray-500 mb-1">Worst Performer</p>
                    <p className="text-lg font-bold text-red-500">
                      {portfolioStats.worstPerformer?.name || 'N/A'}
                    </p>
                    {portfolioStats.worstPerformer && (
                      <p className="text-sm text-red-500">
                        {portfolioStats.worstPerformer.gainLossPercent.toFixed(2)}%
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/*Module 19: Investment Analytics Page (Part 2) - Distribution*/}

            {/* Portfolio Distribution by Type */}
            <div className={`p-6 rounded-2xl ${user.darkMode ? 'bg-gray-800/50' : 'bg-white/80'} backdrop-blur-lg shadow-lg`}>
              <h3 className="text-lg font-semibold mb-4">Portfolio Distribution by Asset Type</h3>
              <div className="space-y-4">
                {investments.length === 0 ? (
                  <div className="text-center py-12">
                    <TrendingUp size={64} className="mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-500 mb-4">No investment data available</p>
                    <div className="flex gap-3 justify-center">
                      <button
                        onClick={() => setShowConnectBrokerModal(true)}
                        className="px-6 py-2 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-xl hover:shadow-lg transition"
                      >
                        <Zap size={18} className="inline mr-2" />
                        Connect Broker API
                      </button>
                      <button
                        onClick={() => openAddModal('investment')}
                        className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl hover:shadow-lg transition"
                      >
                        Add Manual Investment
                      </button>
                    </div>
                  </div>
                ) : (
                  Object.entries(
                    investments.reduce((acc, inv) => {
                      acc[inv.type] = (acc[inv.type] || 0) + parseFloat(inv.amount);
                      return acc;
                    }, {})
                  )
                    .sort((a, b) => b[1] - a[1])
                    .map(([type, amount]) => {
                      const percentage = totalInvestments > 0 ? ((amount / totalInvestments) * 100).toFixed(1) : 0;
                      const count = investments.filter(inv => inv.type === type).length;

                      return (
                        <div key={type} className={`p-4 rounded-xl ${user.darkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                          <div className="flex justify-between mb-2">
                            <div>
                              <span className="font-medium text-lg">{type}</span>
                              <span className="text-sm text-gray-500 ml-2">({count} assets)</span>
                            </div>
                            <span className="text-sm font-semibold">
                              {HelperFunctions.formatCurrency(amount, user.currency)} ({percentage}%)
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-3">
                            <div
                              className="h-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-600 transition-all duration-500"
                              style={{ width: percentage + '%' }}
                            ></div>
                          </div>
                        </div>
                      );
                    })
                )}
              </div>
            </div>

            {/* Distribution by Broker */}
            {(brokers.length > 0 || brokerConnections.length > 0) && (
              <div className={`p-6 rounded-2xl ${user.darkMode ? 'bg-gray-800/50' : 'bg-white/80'} backdrop-blur-lg shadow-lg`}>
                <h3 className="text-lg font-semibold mb-4">Distribution by Broker</h3>
                <div className="space-y-4">
                  {/* API Connected Brokers */}
                  {brokerConnections.map(connection => {
                    const connectedInvestments = investments.filter(inv => inv.brokerConnectionId === connection.id);
                    const value = connectedInvestments.reduce((sum, inv) => sum + parseFloat(inv.amount), 0);
                    const percentage = totalInvestments > 0 ? ((value / totalInvestments) * 100).toFixed(1) : 0;

                    if (value === 0) return null;

                    return (
                      <div key={connection.id} className={`p-4 rounded-xl ${user.darkMode ? 'bg-blue-900/20' : 'bg-blue-50'} border-2 border-blue-500/30`}>
                        <div className="flex justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Zap size={16} className="text-blue-500" />
                            <span className="font-medium">{connection.name}</span>
                            <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full">API</span>
                          </div>
                          <span className="text-sm font-semibold">
                            {HelperFunctions.formatCurrency(value, user.currency)} ({percentage}%)
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-3">
                          <div
                            className="h-3 rounded-full bg-gradient-to-r from-blue-500 to-cyan-600 transition-all duration-500"
                            style={{ width: percentage + '%' }}
                          ></div>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          {connectedInvestments.length} synced assets • Last sync: {connection.lastSync ? new Date(connection.lastSync).toLocaleString() : 'Never'}
                        </p>
                      </div>
                    );
                  })}

                  {/* Manual Brokers */}
                  {brokers.map(broker => {
                    const brokerValue = getBrokerValue(broker._id || broker.id);
                    const brokerInvestments = getInvestmentsByBroker(broker._id || broker.id).filter(inv => !inv.synced);
                    const percentage = totalInvestments > 0 ? ((brokerValue / totalInvestments) * 100).toFixed(1) : 0;

                    if (brokerValue === 0) return null;

                    return (
                      <div key={broker.id} className={`p-4 rounded-xl ${user.darkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                        <div className="flex justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{broker.name}</span>
                            <span className="text-xs bg-gray-500 text-white px-2 py-0.5 rounded-full">Manual</span>
                          </div>
                          <span className="text-sm font-semibold">
                            {HelperFunctions.formatCurrency(brokerValue, user.currency)} ({percentage}%)
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-3">
                          <div
                            className="h-3 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-500"
                            style={{ width: percentage + '%' }}
                          ></div>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          {brokerInvestments.length} manual entries
                        </p>
                      </div>
                    );
                  })}

                  {/* Unlinked investments */}
                  {(() => {
                    const unlinkedInvestments = investments.filter(inv => !inv.brokerId && !inv.brokerConnectionId);
                    const unlinkedValue = unlinkedInvestments.reduce((sum, inv) => sum + parseFloat(inv.amount), 0);
                    const percentage = totalInvestments > 0 ? ((unlinkedValue / totalInvestments) * 100).toFixed(1) : 0;

                    if (unlinkedValue === 0) return null;

                    return (
                      <div className={`p-4 rounded-xl ${user.darkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                        <div className="flex justify-between mb-2">
                          <span className="font-medium text-gray-500">Unlinked Assets</span>
                          <span className="text-sm font-semibold">
                            {HelperFunctions.formatCurrency(unlinkedValue, user.currency)} ({percentage}%)
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-3">
                          <div
                            className="h-3 rounded-full bg-gray-400 transition-all duration-500"
                            style={{ width: percentage + '%' }}
                          ></div>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          {unlinkedInvestments.length} assets not linked to any broker
                        </p>
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}
            
            {/*Module 20: Investment Analytics Page (Part 3) - Top Performers*/}

            {/* Top Performing Assets */}
            {portfolioStats.bestPerformer && (
              <div className={`p-6 rounded-2xl ${user.darkMode ? 'bg-gray-800/50' : 'bg-white/80'} backdrop-blur-lg shadow-lg`}>
                <h3 className="text-lg font-semibold mb-4">Top & Bottom Performers</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Top Performers */}
                  <div>
                    <h4 className="text-sm font-semibold text-green-500 mb-3 flex items-center gap-2">
                      <ArrowUpCircle size={16} />
                      Top Gainers
                    </h4>
                    <div className="space-y-3">
                      {investments
                        .filter(inv => inv.purchasePrice && inv.currentPrice && inv.quantity)
                        .map(inv => {
                          const invested = parseFloat(inv.purchasePrice) * parseFloat(inv.quantity);
                          const current = parseFloat(inv.currentPrice) * parseFloat(inv.quantity);
                          const gain = current - invested;
                          const gainPercent = (gain / invested) * 100;
                          return { ...inv, gain, gainPercent };
                        })
                        .filter(inv => inv.gainPercent > 0)
                        .sort((a, b) => b.gainPercent - a.gainPercent)
                        .slice(0, 3)
                        .map(inv => {
                          const broker = brokers.find(b => (b._id === inv.broker?._id) || (b._id === inv.broker));
                          const connection = brokerConnections.find(c => c.id === inv.brokerConnectionId);

                          return (
                            <div key={inv.id} className={`p-3 rounded-xl ${user.darkMode ? 'bg-green-900/20' : 'bg-green-50'}`}>
                              <div className="flex justify-between items-start mb-1">
                                <div>
                                  <p className="font-medium">{inv.name}</p>
                                  <p className="text-xs text-gray-500">
                                    {inv.type}
                                    {(broker || connection) && ` • ${broker?.name || connection?.name}`}
                                    {inv.synced && <Zap size={12} className="inline ml-1 text-blue-500" />}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm font-bold text-green-500">
                                    +{inv.gainPercent.toFixed(2)}%
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {HelperFunctions.formatCurrency(inv.gain, user.currency)}
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>

                  {/* Bottom Performers */}
                  <div>
                    <h4 className="text-sm font-semibold text-red-500 mb-3 flex items-center gap-2">
                      <ArrowDownCircle size={16} />
                      Top Losers
                    </h4>
                    <div className="space-y-3">
                      {investments
                        .filter(inv => inv.purchasePrice && inv.currentPrice && inv.quantity)
                        .map(inv => {
                          const invested = parseFloat(inv.purchasePrice) * parseFloat(inv.quantity);
                          const current = parseFloat(inv.currentPrice) * parseFloat(inv.quantity);
                          const gain = current - invested;
                          const gainPercent = (gain / invested) * 100;
                          return { ...inv, gain, gainPercent };
                        })
                        .filter(inv => inv.gainPercent < 0)
                        .sort((a, b) => a.gainPercent - b.gainPercent)
                        .slice(0, 3)
                        .map(inv => {
                          const broker = brokers.find(b => (b._id === inv.broker?._id) || (b._id === inv.broker));
                          const connection = brokerConnections.find(c => c.id === inv.brokerConnectionId);

                          return (
                            <div key={inv.id} className={`p-3 rounded-xl ${user.darkMode ? 'bg-red-900/20' : 'bg-red-50'}`}>
                              <div className="flex justify-between items-start mb-1">
                                <div>
                                  <p className="font-medium">{inv.name}</p>
                                  <p className="text-xs text-gray-500">
                                    {inv.type}
                                    {(broker || connection) && ` • ${broker?.name || connection?.name}`}
                                    {inv.synced && <Zap size={12} className="inline ml-1 text-blue-500" />}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm font-bold text-red-500">
                                    {inv.gainPercent.toFixed(2)}%
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {HelperFunctions.formatCurrency(inv.gain, user.currency)}
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* API Integration Info */}
            {brokerConnections.length === 0 && investments.length > 0 && (
              <div className={`p-6 rounded-2xl ${user.darkMode ? 'bg-blue-900/20' : 'bg-blue-50'} border-2 border-blue-500/30`}>
                <div className="flex items-start gap-4">
                  <Zap size={32} className="text-blue-500 flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-2">Automate Your Portfolio Tracking</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      Connect your broker accounts via API to automatically sync your investments in real-time.
                      No more manual data entry - your portfolio updates automatically!
                    </p>
                    <button
                      onClick={() => setShowConnectBrokerModal(true)}
                      className="px-6 py-2 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-xl hover:shadow-lg transition"
                    >
                      Connect Broker API
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/*Module 21: Budget Goals Page*/}

        {/* Budget Goals Page */}
        {currentPage === 'budgets' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-bold flex items-center gap-3">
                <Target size={32} className="text-green-500" />
                Budget Goals
              </h2>
              <button
                onClick={() => setShowBudgetModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:shadow-lg transition"
              >
                <Plus size={20} />
                Add Budget
              </button>
            </div>

            {budgets.length === 0 ? (
              <div className={`p-12 rounded-2xl ${user.darkMode ? 'bg-gray-800/50' : 'bg-white/80'} backdrop-blur-lg shadow-lg text-center`}>
                <Target size={64} className="mx-auto mb-4 text-gray-400" />
                <h3 className="text-xl font-semibold mb-2">No Budgets Set</h3>
                <p className="text-gray-500 mb-4">Start setting monthly budgets to track your spending!</p>
                <button
                  onClick={() => setShowBudgetModal(true)}
                  className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:shadow-lg transition"
                >
                  Create Your First Budget
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {budgets.map(budget => {
                  const spent = expenses
                    .filter(e => e.category === budget.category)
                    .reduce((sum, e) => sum + parseFloat(e.amount), 0);
                  const percentage = (spent / parseFloat(budget.limit)) * 100;
                  const isOverBudget = percentage > 100;
                  const remaining = parseFloat(budget.limit) - spent;

                  return (
                    <div
                      key={budget.id}
                      className={`p-6 rounded-2xl ${user.darkMode ? 'bg-gray-800/50' : 'bg-white/80'} backdrop-blur-lg shadow-lg border ${
                        isOverBudget ? 'border-red-500' : user.darkMode ? 'border-gray-700' : 'border-white/20'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="font-semibold text-lg">{budget.category}</h3>
                          <p className="text-sm text-gray-500">Monthly Budget</p>
                        </div>
                        <button
                          onClick={() => handleDeleteItem(budget.id, 'budget')}
                          className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition"
                          aria-label="Delete budget"
                        >
                          <Trash2 size={16} className="text-red-500" />
                        </button>
                      </div>

                      <div className="mb-4">
                        <div className="flex justify-between mb-2">
                          <span className="text-2xl font-bold">
                            {HelperFunctions.formatCurrency(spent, user.currency)}
                          </span>
                          <span className="text-sm text-gray-500">
                            of {HelperFunctions.formatCurrency(budget.limit, user.currency)}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                          <div
                            className={`h-3 rounded-full transition-all ${isOverBudget ? 'bg-red-500' : 'bg-green-500'}`}
                            style={{ width: Math.min(percentage, 100) + '%' }}
                          ></div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className={`text-sm font-semibold ${isOverBudget ? 'text-red-500' : 'text-green-500'}`}>
                          {percentage.toFixed(0)}% used
                        </span>
                        <span className={`text-sm ${remaining >= 0 ? 'text-gray-500' : 'text-red-500'}`}>
                          {remaining >= 0
                            ? `${HelperFunctions.formatCurrency(remaining, user.currency)} left`
                            : `${HelperFunctions.formatCurrency(Math.abs(remaining), user.currency)} over`
                          }
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/*Module 22: Savings Goals Page*/}

        {/* Savings Goals Page */}
        {currentPage === 'savings' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-bold flex items-center gap-3">
                <Award size={32} className="text-yellow-500" />
                Savings Goals
              </h2>
              <button
                onClick={() => setShowGoalModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-600 text-white rounded-xl hover:shadow-lg transition"
              >
                <Plus size={20} />
                Add Goal
              </button>
            </div>

            {savingsGoals.length === 0 ? (
              <div className={`p-12 rounded-2xl ${user.darkMode ? 'bg-gray-800/50' : 'bg-white/80'} backdrop-blur-lg shadow-lg text-center`}>
                <Award size={64} className="mx-auto mb-4 text-gray-400" />
                <h3 className="text-xl font-semibold mb-2">No Savings Goals Yet</h3>
                <p className="text-gray-500 mb-4">Set financial goals and track your progress!</p>
                <button
                  onClick={() => setShowGoalModal(true)}
                  className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-600 text-white rounded-xl hover:shadow-lg transition"
                >
                  Create Your First Goal
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {savingsGoals.map(goal => {
                  const percentage = (parseFloat(goal.progress) / parseFloat(goal.target)) * 100;
                  const remaining = parseFloat(goal.target) - parseFloat(goal.progress);

                  return (
                    <div
                      key={goal.id}
                      className={`p-6 rounded-2xl ${user.darkMode ? 'bg-gray-800/50' : 'bg-white/80'} backdrop-blur-lg shadow-lg`}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="font-semibold text-xl">{goal.name}</h3>
                          {goal.description && (
                            <p className="text-sm text-gray-500">{goal.description}</p>
                          )}
                        </div>
                        <button
                          onClick={() => handleDeleteItem(goal.id, 'goal')}
                          className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg"
                          aria-label="Delete goal"
                        >
                          <Trash2 size={16} className="text-red-500" />
                        </button>
                      </div>

                      <div className="mb-4">
                        <div className="flex justify-between mb-2">
                          <span className="text-3xl font-bold text-yellow-500">
                            {HelperFunctions.formatCurrency(goal.progress, user.currency)}
                          </span>
                          <span className="text-sm text-gray-500">
                            of {HelperFunctions.formatCurrency(goal.target, user.currency)}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
                          <div
                            className="h-4 rounded-full bg-gradient-to-r from-yellow-500 to-orange-600 transition-all"
                            style={{ width: Math.min(percentage, 100) + '%' }}
                          ></div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="font-semibold text-yellow-500">
                          {percentage.toFixed(0)}% completed
                        </span>
                        <span className="text-gray-500">
                          {remaining > 0
                            ? `${HelperFunctions.formatCurrency(remaining, user.currency)} to go`
                            : 'Goal achieved! 🎉'
                          }
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/*Module 23: History Pages*/}

        {/* History Pages */}
        {(currentPage === 'expense-history' || currentPage === 'income-history' || currentPage === 'investment-history') && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-bold flex items-center gap-3">
                <History size={32} />
                {currentPage === 'expense-history'
                  ? 'Expense History'
                  : currentPage === 'income-history'
                  ? 'Income History'
                  : 'Investment History'
                }
              </h2>

              {/* Broker filter for investment history */}
              {currentPage === 'investment-history' && brokers.length > 0 && (
                <select
                  value={selectedBroker}
                  onChange={(e) => setSelectedBroker(e.target.value)}
                  className={`px-4 py-2 rounded-xl border ${user.darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'} focus:ring-2 focus:ring-purple-500 transition`}
                >
                  <option value="all">All Brokers</option>
                  {brokers.map(broker => (
                    <option key={broker.id} value={broker.id}>
                      {broker.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className={`p-6 rounded-2xl ${user.darkMode ? 'bg-gray-800/50' : 'bg-white/80'} backdrop-blur-lg shadow-lg`}>
              <div className="space-y-3">
                {(() => {
                  const items = currentPage === 'expense-history'
                    ? expenses
                    : currentPage === 'income-history'
                    ? income
                    : getInvestmentsByBroker(selectedBroker);

                  const type = currentPage === 'expense-history'
                    ? 'expense'
                    : currentPage === 'income-history'
                    ? 'income'
                    : 'investment';

                  const gradientColor = currentPage === 'expense-history'
                    ? 'from-red-500 to-pink-600'
                    : currentPage === 'income-history'
                    ? 'from-green-500 to-emerald-600'
                    : 'from-purple-500 to-pink-600';

                  const textColor = currentPage === 'expense-history'
                    ? 'text-red-500'
                    : currentPage === 'income-history'
                    ? 'text-green-500'
                    : 'text-purple-500';

                  if (items.length === 0) {
                    return (
                      <div className="text-center py-12">
                        <History size={64} className="mx-auto mb-4 text-gray-400" />
                        <p className="text-gray-500 mb-4">
                          {currentPage === 'investment-history' && selectedBroker !== 'all'
                            ? 'No investments in this broker account'
                            : 'No records yet. Start tracking your finances!'
                          }
                        </p>
                        <button
                          onClick={() => {
                            if (currentPage === 'investment-history' && selectedBroker !== 'all') {
                              setSelectedBroker('all');
                            } else {
                              openAddModal(type);
                            }
                          }}
                          className={`px-6 py-2 bg-gradient-to-r ${gradientColor} text-white rounded-xl hover:shadow-lg transition`}
                        >
                          {currentPage === 'investment-history' && selectedBroker !== 'all'
                            ? 'View All Investments'
                            : `Add Your First ${type === 'expense' ? 'Expense' : type === 'income' ? 'Income' : 'Investment'}`
                          }
                        </button>
                      </div>
                    );
                  }

                  return items.slice().reverse().map(item => {
                    const broker = currentPage === 'investment-history'
                      ? brokers.find(b => (b._id === item.broker?._id) || (b._id === item.broker))
                      : null;

                    // Calculate gain/loss for investments
                    let gainLoss = null;
                    let gainLossPercent = null;
                    if (currentPage === 'investment-history' && item.purchasePrice && item.currentPrice && item.quantity) {
                      const invested = parseFloat(item.purchasePrice) * parseFloat(item.quantity);
                      const currentValue = parseFloat(item.currentPrice) * parseFloat(item.quantity);
                      gainLoss = currentValue - invested;
                      gainLossPercent = (gainLoss / invested) * 100;
                    }

                    return (
                      <div
                        key={item.id}
                        className={`flex items-center justify-between p-4 rounded-xl ${user.darkMode ? 'bg-gray-700' : 'bg-gray-50'} hover:shadow-md transition`}
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <div className={`w-10 h-10 bg-gradient-to-br ${gradientColor} rounded-xl flex items-center justify-center flex-shrink-0`}>
                            <DollarSign size={18} className="text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{item.description || item.name}</p>
                            <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
                              <span>{item.category || item.type}</span>
                              {broker && (
                                <>
                                  <span>•</span>
                                  <span className="text-indigo-500">{broker.name}</span>
                                </>
                              )}
                              <span>•</span>
                              <span>{item.date}</span>
                              {item.time && (
                                <>
                                  <span>•</span>
                                  <Clock size={12} />
                                  <span>{item.time}</span>
                                </>
                              )}
                            </div>
                            {gainLoss !== null && (
                              <div className={`text-sm mt-1 ${gainLoss >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                {gainLoss >= 0 ? '+' : ''}{HelperFunctions.formatCurrency(gainLoss, user.currency)}
                                ({gainLoss >= 0 ? '+' : ''}{gainLossPercent.toFixed(2)}%)
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-3 flex-shrink-0">
                          <div className="text-right">
                            <span className={`font-bold ${textColor}`}>
                              {HelperFunctions.formatCurrency(item.amount, user.currency)}
                            </span>
                            {item.quantity && (
                              <p className="text-xs text-gray-500">
                                {item.quantity} units
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => handleDeleteItem(item.id, type)}
                            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition"
                            aria-label="Delete item"
                          >
                            <Trash2 size={16} className="text-red-500" />
                          </button>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          </div>
        )}
      </main>

{/* Broker Modal */}
      {showBrokerModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`${user.darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto`}>
            <h3 className="text-2xl font-bold mb-6">
              {editingBroker ? 'Edit Broker Account' : 'Add Broker Account'}
            </h3>

            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-xl flex items-center gap-2">
                <AlertCircle size={18} />
                <span className="text-sm">{error}</span>
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const name = formData.get('name');
                
                if (!name || name.trim().length === 0) {
                  setError('Please enter a broker name');
                  return;
                }

                handleAddBroker({
                  name: name.trim(),
                  platform: formData.get('platform'),
                  accountNumber: formData.get('accountNumber'),
                  notes: formData.get('notes')
                });
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium mb-2">Broker Name</label>
                <input
                  type="text"
                  name="name"
                  required
                  defaultValue={editingBroker?.name || ''}
                  className={`w-full px-4 py-3 rounded-xl border ${user.darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'} focus:ring-2 focus:ring-indigo-500 transition`}
                  placeholder="e.g., My Robinhood Account"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Platform</label>
                <select
                  name="platform"
                  required
                  defaultValue={editingBroker?.platform || ''}
                  className={`w-full px-4 py-3 rounded-xl border ${user.darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'} focus:ring-2 focus:ring-indigo-500 transition`}
                >
                  <option value="">Select Platform</option>
                  {BROKER_PLATFORMS.map(platform => (
                    <option key={platform.name} value={platform.name}>{platform.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Account Number (Optional)
                </label>
                <input
                  type="text"
                  name="accountNumber"
                  defaultValue={editingBroker?.accountNumber || ''}
                  className={`w-full px-4 py-3 rounded-xl border ${user.darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'} focus:ring-2 focus:ring-indigo-500 transition`}
                  placeholder="Account number or ID"
                />
                <p className="text-xs text-gray-500 mt-1">For your reference only</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  name="notes"
                  rows="3"
                  defaultValue={editingBroker?.notes || ''}
                  className={`w-full px-4 py-3 rounded-xl border ${user.darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'} focus:ring-2 focus:ring-indigo-500 transition resize-none`}
                  placeholder="Any additional notes..."
                />
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Saving...' : (editingBroker ? 'Update' : 'Add')} Broker
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowBrokerModal(false);
                    setEditingBroker(null);
                    setError('');
                  }}
                  className="flex-1 bg-gray-300 dark:bg-gray-700 py-3 rounded-xl hover:bg-gray-400 dark:hover:bg-gray-600 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Broker API Connection Modal */}
      {showConnectBrokerModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`${user.darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto`}>
            <h3 className="text-2xl font-bold mb-6">Connect Broker API</h3>

            {syncStatus.status && (
              <div className={`mb-4 p-3 rounded-xl flex items-center gap-2 ${
                syncStatus.status === 'success' ? 'bg-green-100 text-green-700' :
                syncStatus.status === 'error' ? 'bg-red-100 text-red-700' :
                'bg-blue-100 text-blue-700'
              }`}>
                {syncStatus.status === 'syncing' && <Clock size={18} className="animate-spin" />}
                {syncStatus.status === 'success' && <Award size={18} />}
                {syncStatus.status === 'error' && <AlertCircle size={18} />}
                <span className="text-sm">{syncStatus.message}</span>
              </div>
            )}

            {!selectedBrokerPlatform ? (
              <div className="space-y-3">
                <p className="text-sm text-gray-500 mb-4">
                  Select a broker platform to connect. You'll need API credentials from your broker.
                </p>

                {BROKER_PLATFORMS.filter(b => b.apiSupport).map(platform => (
                  <button
                    key={platform.name}
                    onClick={() => setSelectedBrokerPlatform(platform)}
                    className={`w-full p-4 rounded-xl border-2 ${user.darkMode ? 'border-gray-600 hover:border-blue-500' : 'border-gray-200 hover:border-blue-500'} transition text-left`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold">{platform.name}</h4>
                        <p className="text-xs text-gray-500">{platform.authType === 'api_key' ? 'API Key Required' : 'OAuth Authentication'}</p>
                      </div>
                      <div className="text-blue-500">
                        <ArrowUpCircle size={24} />
                      </div>
                    </div>
                  </button>
                ))}

                <button
                  onClick={() => setShowConnectBrokerModal(false)}
                  className="w-full mt-4 px-4 py-3 bg-gray-300 dark:bg-gray-700 rounded-xl hover:bg-gray-400 dark:hover:bg-gray-600 transition"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.target);
                  const connectionData = {
                    name: formData.get('connectionName'),
                    platform: selectedBrokerPlatform.name,
                    apiKey: formData.get('apiKey'),
                    apiSecret: formData.get('apiSecret'),
                    accessToken: formData.get('accessToken'),
                    brokerId: formData.get('brokerId')
                  };
                  handleConnectBroker(connectionData);
                }}
                className="space-y-4"
              >
                <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                  <h4 className="font-semibold mb-2">{selectedBrokerPlatform.name}</h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    You'll need to create API credentials in your {selectedBrokerPlatform.name} account.
                    {selectedBrokerPlatform.docs && (
                      <a
                        href={selectedBrokerPlatform.docs}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:underline ml-1"
                      >
                        View Documentation →
                      </a>
                    )}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Connection Name</label>
                  <input
                    type="text"
                    name="connectionName"
                    required
                    placeholder="e.g., My Alpaca Account"
                    className={`w-full px-4 py-3 rounded-xl border ${user.darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'} focus:ring-2 focus:ring-blue-500 transition`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Link to Broker (Optional)</label>
                  <select
                    name="brokerId"
                    className={`w-full px-4 py-3 rounded-xl border ${user.darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'} focus:ring-2 focus:ring-blue-500 transition`}
                  >
                    <option value="">Not linked</option>
                    {brokers.filter(b => b.platform === selectedBrokerPlatform.name).map(broker => (
                      <option key={broker._id} value={broker._id}>{broker.name}</option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Link to an existing broker account or leave unlinked
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">API Key / Client ID</label>
                  <input
                    type="text"
                    name="apiKey"
                    required
                    placeholder="Enter your API key"
                    className={`w-full px-4 py-3 rounded-xl border ${user.darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'} focus:ring-2 focus:ring-blue-500 transition`}
                  />
                </div>

                {selectedBrokerPlatform.authType === 'api_key' && (
                  <div>
                    <label className="block text-sm font-medium mb-2">API Secret / Secret Key</label>
                    <input
                      type="password"
                      name="apiSecret"
                      required
                      placeholder="Enter your API secret"
                      className={`w-full px-4 py-3 rounded-xl border ${user.darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'} focus:ring-2 focus:ring-blue-500 transition`}
                    />
                  </div>
                )}

                {selectedBrokerPlatform.name === 'Zerodha (Kite)' && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Access Token</label>
                    <input
                      type="text"
                      name="accessToken"
                      required
                      placeholder="Enter your access token"
                      className={`w-full px-4 py-3 rounded-xl border ${user.darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'} focus:ring-2 focus:ring-blue-500 transition`}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Access token expires daily. You'll need to refresh it.
                    </p>
                  </div>
                )}

                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-3">
                  <div className="flex gap-2">
                    <AlertCircle size={18} className="text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div className="text-xs text-yellow-800 dark:text-yellow-200">
                      <p className="font-semibold mb-1">Security Note:</p>
                      <p>Your API credentials are stored securely on the server and never exposed to other users.</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    type="submit"
                    disabled={isSyncing}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSyncing ? 'Connecting...' : 'Connect & Sync'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowConnectBrokerModal(false);
                      setSelectedBrokerPlatform(null);
                      setSyncStatus({});
                    }}
                    className="flex-1 bg-gray-300 dark:bg-gray-700 py-3 rounded-xl hover:bg-gray-400 dark:hover:bg-gray-600 transition"
                  >
                    Back
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}


      {/*Module 24: Add Item Modal*/}

      {/* Add Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`${user.darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto`}>
            <h3 className="text-2xl font-bold mb-6">
              Add {modalType === 'expense' ? 'Expense' : modalType === 'income' ? 'Income' : 'Investment'}
            </h3>

            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-xl flex items-center gap-2">
                <AlertCircle size={18} />
                <span className="text-sm">{error}</span>
              </div>
            )}

            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              const amount = formData.get('amount');

              if (!amount || parseFloat(amount) <= 0) {
                setError('Please enter a valid amount');
                return;
              }

              handleAddItem({
                [modalType === 'investment' ? 'name' : 'description']: formData.get('name'),
                amount: amount,
                category: formData.get('category'),
                type: formData.get('type'),
                quantity: formData.get('quantity'),
                date: formData.get('date'),
                time: formData.get('time'),
                brokerId: formData.get('brokerId'),
                purchasePrice: formData.get('purchasePrice'),
                currentPrice: formData.get('currentPrice')
              });
            }}
            className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium mb-2">
                  {modalType === 'investment' ? 'Investment Name' : 'Description'}
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  className={`w-full px-4 py-3 rounded-xl border ${user.darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'} focus:ring-2 focus:ring-purple-500 transition`}
                  placeholder={
                    modalType === 'investment'
                      ? 'e.g., Apple Stock (AAPL)'
                      : modalType === 'expense'
                      ? 'e.g., Grocery shopping'
                      : 'e.g., Salary payment'
                  }
                />
              </div>

              {modalType === 'investment' ? (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-2">Asset Type</label>
                    <select
                      name="type"
                      required
                      className={`w-full px-4 py-3 rounded-xl border ${user.darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'} focus:ring-2 focus:ring-purple-500 transition`}
                    >
                      <option value="">Select Type</option>
                      {INVESTMENT_TYPES.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Broker Account</label>
                    <select
                      name="brokerId"
                      className={`w-full px-4 py-3 rounded-xl border ${user.darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'} focus:ring-2 focus:ring-purple-500 transition`}
                    >
                      <option value="">No Broker (Manual Entry)</option>
                      {brokers.map(broker => (
                        <option key={broker.id} value={broker.id}>
                          {broker.name} ({broker.platform})
                        </option>
                      ))}
                    </select>
                    {brokers.length === 0 && (
                      <p className="text-xs text-gray-500 mt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setShowAddModal(false);
                            setShowBrokerModal(true);
                          }}
                          className="text-blue-500 hover:underline"
                        >
                          Add a broker
                        </button> to link investments
                      </p>
                    )}
                  </div>
                </>
              ) : (
                <div>
                  <label className="block text-sm font-medium mb-2">Category</label>
                  <select
                    name="category"
                    required
                    className={`w-full px-4 py-3 rounded-xl border ${user.darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'} focus:ring-2 focus:ring-purple-500 transition`}
                  >
                    {(modalType === 'expense' ? categories.expense : categories.income).map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-2">
                  {modalType === 'investment' ? 'Total Value' : 'Amount'} ({CURRENCY_SYMBOLS[user.currency]})
                </label>
                <input
                  type="number"
                  name="amount"
                  step="0.01"
                  min="0.01"
                  required
                  className={`w-full px-4 py-3 rounded-xl border ${user.darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'} focus:ring-2 focus:ring-purple-500 transition`}
                  placeholder="0.00"
                />
              </div>

              {modalType === 'investment' && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-2">Quantity / Units</label>
                    <input
                      type="number"
                      name="quantity"
                      step="0.01"
                      min="0"
                      className={`w-full px-4 py-3 rounded-xl border ${user.darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'} focus:ring-2 focus:ring-purple-500 transition`}
                      placeholder="Number of shares/units"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Purchase Price (per unit)
                    </label>
                    <input
                      type="number"
                      name="purchasePrice"
                      step="0.01"
                      min="0"
                      className={`w-full px-4 py-3 rounded-xl border ${user.darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'} focus:ring-2 focus:ring-purple-500 transition`}
                      placeholder="0.00"
                    />
                    <p className="text-xs text-gray-500 mt-1">For tracking gains/losses</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Current Price (per unit)
                    </label>
                    <input
                      type="number"
                      name="currentPrice"
                      step="0.01"
                      min="0"
                      className={`w-full px-4 py-3 rounded-xl border ${user.darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'} focus:ring-2 focus:ring-purple-500 transition`}
                      placeholder="0.00"
                    />
                    <p className="text-xs text-gray-500 mt-1">Current market price</p>
                  </div>
                </>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Date</label>
                  <input
                    type="date"
                    name="date"
                    defaultValue={HelperFunctions.getCurrentDateTime().date}
                    className={`w-full px-4 py-3 rounded-xl border ${user.darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'} focus:ring-2 focus:ring-purple-500 transition`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Time</label>
                  <input
                    type="time"
                    name="time"
                    defaultValue={HelperFunctions.getCurrentDateTime().time}
                    className={`w-full px-4 py-3 rounded-xl border ${user.darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'} focus:ring-2 focus:ring-purple-500 transition`}
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition"
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setError('');
                  }}
                  className="flex-1 bg-gray-300 dark:bg-gray-700 py-3 rounded-xl hover:bg-gray-400 dark:hover:bg-gray-600 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/*Module 25: Budget Modal*/}

      {/* Budget Modal */}
      {showBudgetModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`${user.darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-6 max-w-md w-full`}>
            <h3 className="text-2xl font-bold mb-6">Add Budget</h3>

            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-xl flex items-center gap-2">
                <AlertCircle size={18} />
                <span className="text-sm">{error}</span>
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const limit = formData.get('limit');

                if (!limit || parseFloat(limit) <= 0) {
                  setError('Please enter a valid budget limit');
                  return;
                }

                handleAddBudget({
                  category: formData.get('category'),
                  limit: limit
                });
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium mb-2">Category</label>
                <select
                  name="category"
                  required
                  className={`w-full px-4 py-3 rounded-xl border ${user.darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'} focus:ring-2 focus:ring-green-500 transition`}
                >
                  {categories.expense.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Monthly Limit ({CURRENCY_SYMBOLS[user.currency]})
                </label>
                <input
                  type="number"
                  name="limit"
                  step="0.01"
                  min="0.01"
                  required
                  className={`w-full px-4 py-3 rounded-xl border ${user.darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'} focus:ring-2 focus:ring-green-500 transition`}
                  placeholder="0.00"
                />
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition"
                >
                  Set Budget
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowBudgetModal(false);
                    setError('');
                  }}
                  className="flex-1 bg-gray-300 dark:bg-gray-700 py-3 rounded-xl hover:bg-gray-400 dark:hover:bg-gray-600 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/*Module 26: Savings Goal Modal*/}

      {/* Savings Goal Modal */}
      {showGoalModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`${user.darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-6 max-w-md w-full`}>
            <h3 className="text-2xl font-bold mb-6">Create Savings Goal</h3>

            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-xl flex items-center gap-2">
                <AlertCircle size={18} />
                <span className="text-sm">{error}</span>
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const target = formData.get('target');

                if (!target || parseFloat(target) <= 0) {
                  setError('Please enter a valid target amount');
                  return;
                }

                handleAddGoal({
                  name: formData.get('name'),
                  description: formData.get('description'),
                  target: target
                });
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium mb-2">Goal Name</label>
                <input
                  type="text"
                  name="name"
                  required
                  className={`w-full px-4 py-3 rounded-xl border ${user.darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'} focus:ring-2 focus:ring-yellow-500 transition`}
                  placeholder="e.g., Emergency Fund"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Description (Optional)</label>
                <input
                  type="text"
                  name="description"
                  className={`w-full px-4 py-3 rounded-xl border ${user.darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'} focus:ring-2 focus:ring-yellow-500 transition`}
                  placeholder="Optional description"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Target Amount ({CURRENCY_SYMBOLS[user.currency]})
                </label>
                <input
                  type="number"
                  name="target"
                  step="0.01"
                  min="0.01"
                  required
                  className={`w-full px-4 py-3 rounded-xl border ${user.darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'} focus:ring-2 focus:ring-yellow-500 transition`}
                  placeholder="0.00"
                />
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-yellow-500 to-orange-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition"
                >
                  Create Goal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowGoalModal(false);
                    setError('');
                  }}
                  className="flex-1 bg-gray-300 dark:bg-gray-700 py-3 rounded-xl hover:bg-gray-400 dark:hover:bg-gray-600 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/*Module 27: Category Management Modal*/}

  {/* Category Management Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`${user.darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto`}>
            <h3 className="text-2xl font-bold mb-6">Manage Categories</h3>

            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-xl flex items-center gap-2">
                <AlertCircle size={18} />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {/* Add New Category Section */}
            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
              <h4 className="font-semibold mb-3">Add New Category</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-2">Category Type</label>
                  <select
                    value={categoryTypeToAdd}
                    onChange={(e) => setCategoryTypeToAdd(e.target.value)}
                    className={`w-full px-4 py-2 rounded-xl border ${user.darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'} focus:ring-2 focus:ring-blue-500 transition`}
                  >
                    <option value="expense">Expense Category</option>
                    <option value="income">Income Category</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Category Name</label>
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    className={`w-full px-4 py-2 rounded-xl border ${user.darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'} focus:ring-2 focus:ring-blue-500 transition`}
                    placeholder="Enter category name"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCategory();
                      }
                    }}
                  />
                </div>

                <button
                  onClick={handleAddCategory}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-2 rounded-xl font-semibold hover:shadow-lg transition"
                >
                  Add Category
                </button>
              </div>
            </div>

            {/* Expense Categories */}
            <div className="mb-6">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <ArrowDownCircle size={18} className="text-red-500" />
                Expense Categories ({categories.expense.length})
              </h4>
              <div className="space-y-2">
                {categories.expense.map(cat => (
                  <div
                    key={cat}
                    className={`flex items-center justify-between p-3 rounded-xl ${user.darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}
                  >
                    <span className="font-medium">{cat}</span>
                    <button
                      onClick={() => handleDeleteCategory(cat, 'expense')}
                      className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition"
                      aria-label={`Delete ${cat} category`}
                    >
                      <Trash2 size={16} className="text-red-500" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Income Categories */}
            <div className="mb-6">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <ArrowUpCircle size={18} className="text-green-500" />
                Income Categories ({categories.income.length})
              </h4>
              <div className="space-y-2">
                {categories.income.map(cat => (
                  <div
                    key={cat}
                    className={`flex items-center justify-between p-3 rounded-xl ${user.darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}
                  >
                    <span className="font-medium">{cat}</span>
                    <button
                      onClick={() => handleDeleteCategory(cat, 'income')}
                      className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition"
                      aria-label={`Delete ${cat} category`}
                    >
                      <Trash2 size={16} className="text-red-500" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => {
                setShowCategoryModal(false);
                setError('');
              }}
              className="w-full bg-gray-300 dark:bg-gray-700 py-3 rounded-xl hover:bg-gray-400 dark:hover:bg-gray-600 transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
      </div>
  );
};

export default CelestiqApp;