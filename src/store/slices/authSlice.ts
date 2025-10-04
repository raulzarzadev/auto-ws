import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { AppUser } from '@/lib/types'

interface AuthState {
  user: AppUser | null
  status: 'idle' | 'loading' | 'authenticated' | 'error'
  error?: string
}

const initialState: AuthState = {
  user: null,
  status: 'idle'
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<AppUser | null>) {
      state.user = action.payload
      state.status = action.payload ? 'authenticated' : 'idle'
      state.error = undefined
    },
    setAuthLoading(state) {
      state.status = 'loading'
    },
    setAuthError(state, action: PayloadAction<string | undefined>) {
      state.status = 'error'
      state.error = action.payload
    },
    signOut() {
      return initialState
    }
  }
})

export const { setUser, setAuthLoading, setAuthError, signOut } =
  authSlice.actions
export default authSlice.reducer
