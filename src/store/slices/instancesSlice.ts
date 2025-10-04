import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { WhatsAppInstance } from '@/lib/types'

interface InstancesState {
  items: WhatsAppInstance[]
  activeInstanceId?: string
  status: 'idle' | 'loading' | 'updating' | 'error'
  error?: string
}

const initialState: InstancesState = {
  items: [],
  status: 'idle'
}

const instancesSlice = createSlice({
  name: 'instances',
  initialState,
  reducers: {
    setInstances(state, action: PayloadAction<WhatsAppInstance[]>) {
      state.items = action.payload
      state.status = 'idle'
      state.error = undefined
    },
    addInstance(state, action: PayloadAction<WhatsAppInstance>) {
      state.items = [action.payload, ...state.items]
    },
    setActiveInstance(state, action: PayloadAction<string | undefined>) {
      state.activeInstanceId = action.payload
    },
    setInstancesStatus(state, action: PayloadAction<InstancesState['status']>) {
      state.status = action.payload
    },
    setInstancesError(state, action: PayloadAction<string | undefined>) {
      state.error = action.payload
      state.status = 'error'
    }
  }
})

export const {
  setInstances,
  addInstance,
  setActiveInstance,
  setInstancesStatus,
  setInstancesError
} = instancesSlice.actions

export default instancesSlice.reducer
