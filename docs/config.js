// Configuration for different environments
const CONFIG = {
  development: {
    API_BASE: 'http://localhost:5000/api'
  },
  production: {
    API_BASE: 'https://sih80.onrender.com/api'
  }
};

// Auto-detect environment
const isDevelopment = window.location.hostname === 'localhost' || 
                     window.location.hostname === '127.0.0.1';

const API_BASE = isDevelopment ? CONFIG.development.API_BASE : CONFIG.production.API_BASE;

// Export for use in script.js
window.API_CONFIG = { API_BASE };