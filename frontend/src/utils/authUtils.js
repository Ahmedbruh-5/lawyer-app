import { API_KEY } from '../constant';
import { authHeaders } from './authTokenStorage';

/**
 * Check if the current user's token is valid
 * @returns {Promise<{isValid: boolean, isAdmin: boolean}>}
 */
export const checkTokenValidity = async () => {
  try {
    const response = await fetch(`${API_KEY}/api/users/verifyAdmin`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        ...authHeaders(),
      },
    });
    
    if (response.ok) {
      const data = await response.json();
      return { isValid: true, isAdmin: data.isAdmin };
    } else {
      return { isValid: false, isAdmin: false };
    }
  } catch (error) {
    console.error('Token validation error:', error);
    return { isValid: false, isAdmin: false };
  }
};

/**
 * Clear authentication state and redirect to signin
 * @param {Function} dispatch - Redux dispatch function
 * @param {Function} navigate - React Router navigate function
 */
export const handleTokenExpiration = (dispatch, navigate) => {
  dispatch({ type: 'auth/logout' });
  navigate('/signin');
};
