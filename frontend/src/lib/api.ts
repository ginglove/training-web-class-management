import { useAuthStore } from '../stores/authStore';

// Use relative path by default so Next.js rewrites (or Vercel routes) proxy the request
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

interface FetchApiOptions extends RequestInit {
  _isRetry?: boolean;
}

export async function fetchApi(endpoint: string, options: FetchApiOptions = {}) {
  const { token } = useAuthStore.getState();

  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    const { refreshToken, setTokens, logout } = useAuthStore.getState();

    // If we have a refresh token, try to get a new access token
    if (refreshToken && !options._isRetry) {
      try {
        const refreshResponse = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token: refreshToken }),
        });

        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json();
          setTokens(refreshData.access_token, refreshData.refresh_token);
          
          // Retry original request with new token
          const retryHeaders = new Headers(options.headers || {});
          retryHeaders.set('Content-Type', 'application/json');
          retryHeaders.set('Authorization', `Bearer ${refreshData.access_token}`);
          
          return fetchApi(endpoint, { ...options, headers: retryHeaders, _isRetry: true });
        }
      } catch (e) {
        console.error('Failed to refresh token', e);
      }
    }

    // If refresh failed or no refresh token, logout
    logout();
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
    throw new Error('Unauthorized');
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(
      data.message || 
      data.error || 
      `API Request Failed (${response.status} ${response.statusText})`
    ) as Error & Record<string, unknown>;
    
    // Attach original data payload to the error object so we can read err.error codes
    Object.assign(error, data);
    error.status = response.status;
    throw error;
  }

  return data;
}

/**
 * Utility to extract readable message from API errors
 */
export function getErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error) {
    // If the error object has a 'message' property from the API response
    const apiError = err as Error & { message?: string; error?: string };
    return apiError.message || apiError.error || err.message;
  }
  return fallback;
}
