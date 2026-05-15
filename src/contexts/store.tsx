'use client'
import { createContext, useContext } from 'react'
import type { Store } from '@/types'

export const StoreContext = createContext<Store | null>(null)
export const useActiveStore = () => useContext(StoreContext)
