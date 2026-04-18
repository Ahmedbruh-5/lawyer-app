import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authAPI } from '../services/apiService';
import { clearStoredAccessToken } from '../utils/authTokenStorage';

// Async thunk for loading user
export const loadUser = createAsyncThunk(
  'auth/loadUser',
  async (_, { rejectWithValue, dispatch }) => {
    try {
      const response = await authAPI.getCurrentUser();
      return response.data;
    } catch (error) {
      // If token is expired or invalid, clear authentication state
      if (error.response?.status === 401) {
        console.log('🔐 Token expired during user load, clearing auth state');
        dispatch(logout());
      }
      return rejectWithValue(error.response?.data || 'Failed to load user');
    }
  }
);

const initialState = {
  user: null,
  isAuthenticated: false,
  loading: false,
  error: null
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.error = null;
      clearStoredAccessToken();
      // Clear localStorage to ensure clean logout
      localStorage.removeItem('persist:root');
    },
    Userlogin: (state, action) => {
      state.user = action.payload.user;
      state.isAuthenticated = true;
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(loadUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.isAuthenticated = false;
      });
  }
});

export const { clearError, logout, Userlogin } = authSlice.actions;
export default authSlice.reducer;
