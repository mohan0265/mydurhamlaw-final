
// Resilient fetch wrapper with retries, timeouts, and user-friendly error handling
import toast from 'react-hot-toast';
import { telemetry } from './telemetry';

export interface FetchOptions extends RequestInit {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  showErrorToast?: boolean;
  endpoint?: string;
}

export class FetchError extends Error {
  constructor(
    message: string,
    public status?: number,
    public endpoint?: string,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'FetchError';
  }
}

export const resilientFetch = async (
  url: string,
  options: FetchOptions = {}
): Promise<Response> => {
  const {
    timeout = 10000, // 10s default timeout
    retries = 2,
    retryDelay = 1000,
    showErrorToast = true,
    endpoint = url,
    ...fetchOptions
  } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const error = new FetchError(
          `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          endpoint
        );
        
        // Track API errors
        telemetry.apiError(endpoint, error.message, response.status);
        
        if (showErrorToast) {
          toast.error(getFriendlyErrorMessage(response.status));
        }
        
        throw error;
      }

      return response;
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry on abort or certain status codes
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          if (showErrorToast) {
            toast.error('Request timed out. Please try again.');
          }
          break;
        }
        
        if (error instanceof FetchError && error.status && error.status >= 400 && error.status < 500) {
          // Don't retry 4xx errors
          break;
        }
      }

      // Wait before retrying
      if (attempt < retries) {
        await new Promise(resolve => setTimeout(resolve, retryDelay * Math.pow(2, attempt)));
      }
    }
  }

  clearTimeout(timeoutId);
  
  // All retries failed
  if (lastError) {
    telemetry.apiError(endpoint, lastError.message);
    if (showErrorToast) {
      toast.error('Unable to connect. Please check your internet connection.');
    }
    throw lastError;
  }

  throw new FetchError('Unknown error occurred', undefined, endpoint);
};

// User-friendly error messages
function getFriendlyErrorMessage(status: number): string {
  switch (status) {
    case 400:
      return 'Invalid request. Please check your input.';
    case 401:
      return 'Please log in to continue.';
    case 403:
      return 'You don\'t have permission to access this.';
    case 404:
      return 'The requested resource was not found.';
    case 429:
      return 'Too many requests. Please wait a moment and try again.';
    case 500:
      return 'Server error. Our team has been notified.';
    case 502:
    case 503:
    case 504:
      return 'Service temporarily unavailable. Please try again in a moment.';
    default:
      return 'Something went wrong. Please try again.';
  }
}

// Convenience wrapper for JSON APIs
export const apiCall = async <T = any>(
  url: string,
  options: FetchOptions = {}
): Promise<T> => {
  const response = await resilientFetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new FetchError(`API call failed: ${response.statusText}`, response.status, url);
  }

  return response.json();
};

export default resilientFetch;
