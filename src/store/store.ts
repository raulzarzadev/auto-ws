import { configureStore } from '@reduxjs/toolkit'

import authReducer from '@/store/slices/authSlice'
import instancesReducer from '@/store/slices/instancesSlice'

export const makeStore = () =>
  configureStore({
    reducer: {
      auth: authReducer,
      instances: instancesReducer
    }
  })

export type AppStore = ReturnType<typeof makeStore>
export type AppDispatch = AppStore['dispatch']
export type RootState = ReturnType<AppStore['getState']>

let store: AppStore | undefined

export const getStore = () => {
  if (!store) {
    store = makeStore()
  }
  return store
}
