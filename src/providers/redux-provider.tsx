'use client'

import { PropsWithChildren } from 'react'
import { Provider } from 'react-redux'

import { getStore } from '@/store/store'

export const ReduxProvider = ({ children }: PropsWithChildren) => {
  const store = getStore()
  return <Provider store={store}>{children}</Provider>
}
