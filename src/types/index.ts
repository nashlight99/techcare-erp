export type RepairStatus =
  | 'received'
  | 'in_progress'
  | 'waiting_parts'
  | 'waiting_customer'
  | 'completed'
  | 'cancelled'

export type UserRole = 'admin' | 'director' | 'employee'

export type SubscriptionStatus = 'none' | 'high_tech_care' | 'premium'

export interface Customer {
  id: string
  first_name: string
  last_name: string
  phone?: string | null
  whatsapp_available?: boolean
  email?: string | null
  address?: string | null
  tags?: string[]
  subscription_status?: SubscriptionStatus
  notes?: string | null
  created_at: string
  updated_at: string
}

export interface Repair {
  id: string
  ticket_number: string
  customer_id: string
  customers?: Pick<Customer, 'first_name' | 'last_name'>
  store_id?: string | null
  assigned_user_id?: string | null
  device_brand: string
  device_model: string
  serial_number?: string | null
  imei?: string | null
  issue_description: string
  status: RepairStatus
  estimated_cost?: number | null
  final_cost?: number | null
  internal_notes?: string | null
  completed_at?: string | null
  created_at: string
  updated_at: string
}

export interface Store {
  id: string
  name: string
  address?: string | null
  phone?: string | null
  is_active?: boolean
}

export interface User {
  id: string
  email: string
  full_name: string
  role: UserRole
  store_id?: string | null
  is_active: boolean
  last_login_at?: string | null
  created_at: string
}

export interface DashboardStats {
  totalCustomers: number
  activeRepairs: number
  completedToday: number
  waitingParts: number
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
}
