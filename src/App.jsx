// module 1 import and initial setup
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

// Constants
const CURRENCY_SYMBOLS = { 
  USD: '$', 
  EUR: '€', 
  GBP: '£', 
  INR: '₹', 
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

const STORAGE_KEYS = {
  USER: 'celestiq_user',
  EXPENSES: 'celestiq_expenses',
  INCOME: 'celestiq_income',
  INVESTMENTS: 'celestiq_investments',
  BUDGETS: 'celestiq_budgets',
  GOALS: 'celestiq_goals',
  CATEGORIES: 'celestiq_categories'
};

// module 2 Helper functions and utilities
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

  // Generate unique ID
  generateId: () => Date.now() + Math.random().toString(36).substr(2, 9),

  // Save to localStorage
  saveToStorage: (key, data) => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error('Error saving to storage:', error);
      return false;
    }
  },

  // Load from localStorage
  loadFromStorage: (key, defaultValue = null) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error('Error loading from storage:', error);
      return defaultValue;
    }
  }
};

// module 3 Main component setup
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
  
  // Error handling
  const [error, setError] = useState('');

  // module 4 useEffect hooks and data persistence
  
  // Load data from localStorage on mount
  useEffect(() => {
    const savedUser = HelperFunctions.loadFromStorage(STORAGE_KEYS.USER);
    const savedExpenses = HelperFunctions.loadFromStorage(STORAGE_KEYS.EXPENSES, []);
    const savedIncome = HelperFunctions.loadFromStorage(STORAGE_KEYS.INCOME, []);
    const savedInvestments = HelperFunctions.loadFromStorage(STORAGE_KEYS.INVESTMENTS, []);
    const savedBudgets = HelperFunctions.loadFromStorage(STORAGE_KEYS.BUDGETS, []);
    const savedGoals = HelperFunctions.loadFromStorage(STORAGE_KEYS.GOALS, []);
    const savedCategories = HelperFunctions.loadFromStorage(STORAGE_KEYS.CATEGORIES);
    
    if (savedUser) {
      setUser(savedUser);
      setIsAuthenticated(true);
    }
    
    setExpenses(savedExpenses);
    setIncome(savedIncome);
    setInvestments(savedInvestments);
    setBudgets(savedBudgets);
    setSavingsGoals(savedGoals);
    
    if (savedCategories) {
      setCategories(savedCategories);
    }
  }, []);
  
  // Save user data when it changes
  useEffect(() => {
    if (isAuthenticated) {
      HelperFunctions.saveToStorage(STORAGE_KEYS.USER, user);
    }
  }, [user, isAuthenticated]);
  
  // Save financial data when it changes
  useEffect(() => {
    HelperFunctions.saveToStorage(STORAGE_KEYS.EXPENSES, expenses);
  }, [expenses]);
  
  useEffect(() => {
    HelperFunctions.saveToStorage(STORAGE_KEYS.INCOME, income);
  }, [income]);
  
  useEffect(() => {
    HelperFunctions.saveToStorage(STORAGE_KEYS.INVESTMENTS, investments);
  }, [investments]);
  
  useEffect(() => {
    HelperFunctions.saveToStorage(STORAGE_KEYS.BUDGETS, budgets);
  }, [budgets]);
  
  useEffect(() => {
    HelperFunctions.saveToStorage(STORAGE_KEYS.GOALS, savingsGoals);
  }, [savingsGoals]);
  
  useEffect(() => {
    HelperFunctions.saveToStorage(STORAGE_KEYS.CATEGORIES, categories);
  }, [categories]);
  
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

  // module 5 Event handlers
  
  // Authentication handler
  const handleAuth = useCallback((e) => {
    e.preventDefault();
    setError('');
    
    // Validate email
    if (!HelperFunctions.validateEmail(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }
    
    // Validate password length
    if (!showOtpInput && formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    
    if (authScreen === 'register' && !showOtpInput) {
      // Send OTP (simulated)
      setShowOtpInput(true);
      setError('');
      alert('OTP sent to ' + formData.email);
      return;
    }
    
    if (authScreen === 'register' && showOtpInput) {
      if (!formData.otp || formData.otp.length !== 6) {
        setError('Please enter a valid 6-digit OTP');
        return;
      }
      setUser({ ...user, name: formData.name, email: formData.email });
    } else {
      setUser({ ...user, email: formData.email });
    }
    
    setIsAuthenticated(true);
    setFormData({ email: '', password: '', name: '', otp: '' });
    setShowOtpInput(false);
    setError('');
  }, [authScreen, formData, showOtpInput, user]);
  
  // Open add modal
  const openAddModal = useCallback((type) => {
    setModalType(type);
    setEditingItem(null);
    setShowAddModal(true);
    setMenuOpen(false);
    setError('');
  }, []);
  
  // Handle add item
  const handleAddItem = useCallback((item) => {
    try {
      const { date, time } = HelperFunctions.getCurrentDateTime();
      const newItem = {
        ...item,
        id: HelperFunctions.generateId(),
        date: item.date || date,
        time: item.time || time,
        amount: parseFloat(item.amount).toFixed(2)
      };
      
      if (modalType === 'expense') {
        setExpenses(prev => [...prev, newItem]);
      } else if (modalType === 'income') {
        setIncome(prev => [...prev, newItem]);
      } else if (modalType === 'investment') {
        setInvestments(prev => [...prev, newItem]);
      }
      
      setShowAddModal(false);
      setError('');
    } catch (err) {
      setError('Failed to add item. Please try again.');
    }
  }, [modalType]);
  
  // Handle delete item
  const handleDeleteItem = useCallback((id, type) => {
    if (!window.confirm('Are you sure you want to delete this item?')) {
      return;
    }
    
    try {
      if (type === 'expense') {
        setExpenses(prev => prev.filter(e => e.id !== id));
      } else if (type === 'income') {
        setIncome(prev => prev.filter(i => i.id !== id));
      } else if (type === 'investment') {
        setInvestments(prev => prev.filter(inv => inv.id !== id));
      } else if (type === 'budget') {
        setBudgets(prev => prev.filter(b => b.id !== id));
      } else if (type === 'goal') {
        setSavingsGoals(prev => prev.filter(g => g.id !== id));
      }
    } catch (err) {
      setError('Failed to delete item. Please try again.');
    }
  }, []);
  
  // Handle add budget
  const handleAddBudget = useCallback((budget) => {
    try {
      // Check if budget already exists for this category
      const existingBudget = budgets.find(b => b.category === budget.category);
      if (existingBudget) {
        setError('Budget already exists for this category');
        return;
      }
      
      setBudgets(prev => [...prev, { 
        ...budget, 
        id: HelperFunctions.generateId(),
        limit: parseFloat(budget.limit).toFixed(2)
      }]);
      setShowBudgetModal(false);
      setError('');
    } catch (err) {
      setError('Failed to add budget. Please try again.');
    }
  }, [budgets]);
  
  // Handle add goal
  const handleAddGoal = useCallback((goal) => {
    try {
      setSavingsGoals(prev => [...prev, { 
        ...goal, 
        id: HelperFunctions.generateId(),
        progress: 0,
        target: parseFloat(goal.target).toFixed(2)
      }]);
      setShowGoalModal(false);
      setError('');
    } catch (err) {
      setError('Failed to add goal. Please try again.');
    }
  }, []);
  
  // Handle add category
  const handleAddCategory = useCallback(() => {
    if (!newCategoryName.trim()) {
      setError('Please enter a category name');
      return;
    }
    
    const trimmedName = newCategoryName.trim();
    
    // Check if category already exists
    if (categories[categoryTypeToAdd].includes(trimmedName)) {
      setError('Category already exists');
      return;
    }
    
    setCategories(prev => ({
      ...prev,
      [categoryTypeToAdd]: [...prev[categoryTypeToAdd], trimmedName]
    }));
    
    setNewCategoryName('');
    setError('');
    alert('Category added successfully!');
  }, [newCategoryName, categoryTypeToAdd, categories]);
  
  // Handle delete category
  const handleDeleteCategory = useCallback((category, type) => {
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
    
    setCategories(prev => ({
      ...prev,
      [type]: prev[type].filter(cat => cat !== category)
    }));
    
    setError('');
    alert('Category deleted successfully!');
  }, [categories]);
  
  // Handle logout
  const handleLogout = useCallback(() => {
    if (window.confirm('Are you sure you want to logout?')) {
      setIsAuthenticated(false);
      setShowProfile(false);
      localStorage.removeItem(STORAGE_KEYS.USER);
    }
  }, []);

  // module 6 Calculated values
  
  const totalExpenses = expenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
  const totalIncome = income.reduce((sum, i) => sum + parseFloat(i.amount || 0), 0);
  const totalInvestments = investments.reduce((sum, inv) => sum + parseFloat(inv.amount || 0), 0);
  const balance = totalIncome - totalExpenses;
  
  const financialHealthScore = HelperFunctions.calculateHealthScore(
    balance,
    totalIncome,
    totalInvestments
  );

  // module 7 Login/Register screen
  
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
              </div>
            )}
            
            <button 
              type="submit" 
              className="w-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white py-3 rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all duration-200"
            >
              {authScreen === 'register' && !showOtpInput ? 'Send OTP' : authScreen === 'register' ? 'Register' : 'Login'}
            </button>
          </form>
          
          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setAuthScreen(authScreen === 'login' ? 'register' : 'login');
                setShowOtpInput(false);
                setFormData({ email: '', password: '', name: '', otp: '' });
                setError('');
              }}
              className="text-sm text-purple-600 hover:text-purple-700"
            >
              {authScreen === 'login' ? "Don't have an account? Register" : 'Already have an account? Login'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // module 8 Header and navigation menu
  
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
              { icon: LineChart, label: 'Investment Analytics', page: 'invest-analytics' },
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

      {/*module 9 Profile dropdown*/}
      
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


    {/*module 10 Dashboard page*/}
  
        
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

        {/*module 11 Investment analytics page*/}
        
        {currentPage === 'invest-analytics' && (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold flex items-center gap-3">
              <LineChart size={32} className="text-purple-500" />
              Investment Analytics
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { 
                  label: 'Total Portfolio Value', 
                  value: HelperFunctions.formatCurrency(totalInvestments, user.currency), 
                  icon: DollarSign,
                  isText: true
                },
                { 
                  label: 'Total Assets', 
                  value: investments.length, 
                  icon: TrendingUp, 
                  isCount: true 
                },
                { 
                  label: 'Best Performer', 
                  value: investments.length > 0 
                    ? Object.entries(
                        investments.reduce((acc, inv) => {
                          acc[inv.type] = (acc[inv.type] || 0) + parseFloat(inv.amount);
                          return acc;
                        }, {})
                      ).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A'
                    : 'N/A', 
                  icon: LineChart, 
                  isText: true 
                },
              ].map((item, idx) => (
                <div 
                  key={idx} 
                  className={`p-6 rounded-2xl ${user.darkMode ? 'bg-gray-800/50' : 'bg-white/80'} backdrop-blur-lg shadow-lg`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-gray-500">{item.label}</span>
                    <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl">
                      <item.icon size={18} className="text-white" />
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-purple-500">
                    {item.isText ? item.value : item.isCount ? item.value : item.value}
                  </p>
                </div>
              ))}
            </div>
            
            <div className={`p-6 rounded-2xl ${user.darkMode ? 'bg-gray-800/50' : 'bg-white/80'} backdrop-blur-lg shadow-lg`}>
              <h3 className="text-lg font-semibold mb-4">Portfolio Distribution</h3>
              
              <div className="space-y-4">
                {investments.length === 0 ? (
                  <div className="text-center py-12">
                    <TrendingUp size={64} className="mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-500">No investment data available</p>
                    <button
                      onClick={() => openAddModal('investment')}
                      className="mt-4 px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl hover:shadow-lg transition"
                    >
                      Add Your First Investment
                    </button>
                  </div>
                ) : (
                  Object.entries(
                    investments.reduce((acc, inv) => {
                      acc[inv.type] = (acc[inv.type] || 0) + parseFloat(inv.amount);
                      return acc;
                    }, {})
                  ).map(([type, amount]) => {
                    const percentage = totalInvestments > 0 ? ((amount / totalInvestments) * 100).toFixed(1) : 0;
                    return (
                      <div key={type}>
                        <div className="flex justify-between mb-2">
                          <span className="font-medium">{type}</span>
                          <span className="text-sm font-semibold">
                            {HelperFunctions.formatCurrency(amount, user.currency)} ({percentage}%)
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
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
          </div>
        )}

        {/*module 12 Budget goals page*/}
        
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

        {/*module 13 Savings goals page*/}
        
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

        {/*module 14 History pages*/}
        
        {(currentPage === 'expense-history' || currentPage === 'income-history' || currentPage === 'investment-history') && (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold flex items-center gap-3">
              <History size={32} />
              {currentPage === 'expense-history' 
                ? 'Expense History' 
                : currentPage === 'income-history' 
                ? 'Income History' 
                : 'Investment History'
              }
            </h2>
            
            <div className={`p-6 rounded-2xl ${user.darkMode ? 'bg-gray-800/50' : 'bg-white/80'} backdrop-blur-lg shadow-lg`}>
              <div className="space-y-3">
                {(() => {
                  const items = currentPage === 'expense-history' 
                    ? expenses 
                    : currentPage === 'income-history' 
                    ? income 
                    : investments;
                  
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
                        <p className="text-gray-500 mb-4">No records yet. Start tracking your finances!</p>
                        <button
                          onClick={() => openAddModal(type)}
                          className={`px-6 py-2 bg-gradient-to-r ${gradientColor} text-white rounded-xl hover:shadow-lg transition`}
                        >
                          Add Your First {type === 'expense' ? 'Expense' : type === 'income' ? 'Income' : 'Investment'}
                        </button>
                      </div>
                    );
                  }
                  
                  return items.slice().reverse().map(item => (
                    <div 
                      key={item.id} 
                      className={`flex items-center justify-between p-4 rounded-xl ${user.darkMode ? 'bg-gray-700' : 'bg-gray-50'} hover:shadow-md transition`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 bg-gradient-to-br ${gradientColor} rounded-xl flex items-center justify-center`}>
                          <DollarSign size={18} className="text-white" />
                        </div>
                        <div>
                          <p className="font-medium">{item.description || item.name}</p>
                          <p className="text-sm text-gray-500 flex items-center gap-2">
                            {item.category || item.type} • {item.date}
                            {item.time && (
                              <>
                                • <Clock size={12} /> {item.time}
                              </>
                            )}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <span className={`font-bold ${textColor}`}>
                          {HelperFunctions.formatCurrency(item.amount, user.currency)}
                        </span>
                        <button 
                          onClick={() => handleDeleteItem(item.id, type)} 
                          className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition"
                          aria-label="Delete item"
                        >
                          <Trash2 size={16} className="text-red-500" />
                        </button>
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </div>
          </div>
        )}
      </main>

      {/*module 15 Add item modal*/}
      
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
            
            <form 
              onSubmit={(e) => {
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
                  time: formData.get('time')
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
                      ? 'e.g., Apple Stock' 
                      : modalType === 'expense' 
                      ? 'e.g., Grocery shopping' 
                      : 'e.g., Salary payment'
                  }
                />
              </div>
              
              {modalType === 'investment' ? (
                <div>
                  <label className="block text-sm font-medium mb-2">Type</label>
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
                  Amount ({CURRENCY_SYMBOLS[user.currency]})
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
                <div>
                  <label className="block text-sm font-medium mb-2">Quantity (Optional)</label>
                  <input
                    type="number"
                    name="quantity"
                    step="0.01"
                    min="0"
                    className={`w-full px-4 py-3 rounded-xl border ${user.darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'} focus:ring-2 focus:ring-purple-500 transition`}
                    placeholder="Number of units/shares"
                  />
                </div>
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

{/*module 16 Budget modal*/}
      
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

      {/*module 17 Savings goal modal*/}
      
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

      {/*module 18 Category management modal*/}
      
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