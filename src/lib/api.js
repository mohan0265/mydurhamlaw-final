// Resilient API client with retries and proper error handling
class APIClient {
  constructor(baseURL = '') {
    this.baseURL = baseURL;
    this.defaultRetries = 3;
    this.defaultTimeout = 10000;
  }

  async request(endpoint, options = {}) {
    const {
      method = 'GET',
      body,
      headers = {},
      retries = this.defaultRetries,
      timeout = this.defaultTimeout,
    } = options;

    const url = `${this.baseURL}${endpoint}`;
    const config = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    if (body) {
      config.body = JSON.stringify(body);
    }

    // Add auth header if available
    const token = localStorage.getItem('supabase.auth.token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        
        config.signal = controller.signal;
        
        const response = await fetch(url, config);
        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return await response.json();
      } catch (error) {
        if (attempt === retries) {
          // Final attempt failed
          this.showError(`Connection failed: ${error.message}`);
          throw error;
        }
        
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
  }

  showError(message) {
    // Show toast notification or add to error state
    console.error('API Error:', message);
    
    // If you have a toast library:
    // toast.error(message);
    
    // Or dispatch to global error state:
    // store.dispatch(addError(message));
  }

  // Convenience methods
  get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' });
  }

  post(endpoint, body, options = {}) {
    return this.request(endpoint, { ...options, method: 'POST', body });
  }

  put(endpoint, body, options = {}) {
    return this.request(endpoint, { ...options, method: 'PUT', body });
  }

  delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }
}

export const api = new APIClient('/api');

// Usage examples:
// const response = await api.post('/chat', { messages, mode, module });
// const sessions = await api.get('/session');
// const moodTrend = await api.get('/mood/trend');