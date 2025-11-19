const axios = require('axios');

// Alpaca API Service
const alpacaService = {
  getAccount: async (apiKey, secretKey) => {
    try {
      const response = await axios.get('https://paper-api.alpaca.markets/v2/account', {
        headers: {
          'APCA-API-KEY-ID': apiKey,
          'APCA-API-SECRET-KEY': secretKey
        }
      });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  },

  getPositions: async (apiKey, secretKey) => {
    try {
      const response = await axios.get('https://paper-api.alpaca.markets/v2/positions', {
        headers: {
          'APCA-API-KEY-ID': apiKey,
          'APCA-API-SECRET-KEY': secretKey
        }
      });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  },

  transformData: (positions) => {
    return positions.map(position => ({
      name: position.symbol,
      type: 'Stocks',
      amount: (parseFloat(position.qty) * parseFloat(position.current_price)).toFixed(2),
      quantity: position.qty,
      purchasePrice: position.avg_entry_price,
      currentPrice: position.current_price,
      synced: true
    }));
  }
};

// Coinbase API Service
const coinbaseService = {
  getAccounts: async (apiKey, apiSecret) => {
    try {
      const timestamp = Math.floor(Date.now() / 1000);
      const response = await axios.get('https://api.coinbase.com/v2/accounts', {
        headers: {
          'CB-ACCESS-KEY': apiKey,
          'CB-ACCESS-SIGN': apiSecret,
          'CB-ACCESS-TIMESTAMP': timestamp,
          'CB-VERSION': '2021-01-01'
        }
      });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  },

  transformData: (accounts) => {
    return accounts.data.map(account => ({
      name: `${account.currency} Wallet`,
      type: 'Crypto',
      amount: parseFloat(account.balance.amount).toFixed(2),
      quantity: account.balance.amount,
      purchasePrice: null,
      currentPrice: null,
      synced: true
    }));
  }
};

// Zerodha Kite API Service
const zerodhaService = {
  getHoldings: async (apiKey, accessToken) => {
    try {
      const response = await axios.get('https://api.kite.trade/holdings', {
        headers: {
          'X-Kite-Version': '3',
          'Authorization': `token ${apiKey}:${accessToken}`
        }
      });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  },

  getPositions: async (apiKey, accessToken) => {
    try {
      const response = await axios.get('https://api.kite.trade/positions', {
        headers: {
          'X-Kite-Version': '3',
          'Authorization': `token ${apiKey}:${accessToken}`
        }
      });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  },

  transformData: (holdings) => {
    return holdings.data.map(holding => ({
      name: holding.tradingsymbol,
      type: 'Stocks',
      amount: (parseFloat(holding.quantity) * parseFloat(holding.last_price)).toFixed(2),
      quantity: holding.quantity,
      purchasePrice: holding.average_price,
      currentPrice: holding.last_price,
      synced: true
    }));
  }
};

// Main sync function
const syncBrokerInvestments = async (platform, credentials) => {
  try {
    let result;

    switch (platform) {
      case 'Alpaca':
        result = await alpacaService.getPositions(credentials.apiKey, credentials.apiSecret);
        if (result.success) {
          return { success: true, data: alpacaService.transformData(result.data) };
        }
        break;

      case 'Coinbase':
        result = await coinbaseService.getAccounts(credentials.apiKey, credentials.apiSecret);
        if (result.success) {
          return { success: true, data: coinbaseService.transformData(result) };
        }
        break;

      case 'Zerodha (Kite)':
        result = await zerodhaService.getHoldings(credentials.apiKey, credentials.accessToken);
        if (result.success) {
          return { success: true, data: zerodhaService.transformData(result) };
        }
        break;

      default:
        return { success: false, error: 'Unsupported broker platform' };
    }

    return result;
  } catch (error) {
    console.error('Broker sync error:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  syncBrokerInvestments,
  alpacaService,
  coinbaseService,
  zerodhaService
};