const jwt = require('jsonwebtoken');

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

// Calculate financial health score
const calculateHealthScore = (balance, totalIncome, totalInvestments) => {
  if (totalIncome === 0) return 0;
  
  const savingsRate = (balance / totalIncome) * 50;
  const investmentRate = (totalInvestments / totalIncome) * 30;
  const baseScore = 20;
  
  const score = savingsRate + investmentRate + baseScore;
  return Math.min(100, Math.max(0, score)).toFixed(0);
};

// Format date to ISO string
const formatDate = (date) => {
  return new Date(date).toISOString();
};

// Get current date and time
const getCurrentDateTime = () => {
  const now = new Date();
  return {
    date: now.toISOString().split('T')[0],
    time: now.toTimeString().split(' ')[0].substring(0, 5)
  };
};

// Validate email format
const isValidEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

// Calculate date range for queries
const getDateRange = (period) => {
  const now = new Date();
  let startDate;

  switch (period) {
    case 'week':
      startDate = new Date(now.setDate(now.getDate() - 7));
      break;
    case 'month':
      startDate = new Date(now.setMonth(now.getMonth() - 1));
      break;
    case 'year':
      startDate = new Date(now.setFullYear(now.getFullYear() - 1));
      break;
    default:
      startDate = new Date(0); // Beginning of time
  }

  return { startDate, endDate: new Date() };
};

// Emit socket event to user
const emitToUser = (io, userId, event, data) => {
  io.to(`user_${userId}`).emit(event, data);
};

module.exports = {
  generateToken,
  calculateHealthScore,
  formatDate,
  getCurrentDateTime,
  isValidEmail,
  getDateRange,
  emitToUser
};