export interface Station {
  id: string
  name: string
  type: 'black_white' | 'color' | 'large_format'
  description: string
  equipment: string[]
  capacity: number
  status: 'available' | 'maintenance' | 'disabled'
  hourlyRate: number
  createdAt: string
}

export interface TimeSlot {
  id: string
  stationId: string
  date: string
  startTime: string
  endTime: string
  status: 'available' | 'occupied' | 'merged' | 'locked'
  bookingId?: string
}

export interface Booking {
  id: string
  stationId: string
  photographerId: string
  photographerName: string
  date: string
  startTime: string
  endTime: string
  duration: number
  isMerged: boolean
  mergedFrom?: string[]
  mergedTo?: string
  status: 'active' | 'cancelled' | 'completed'
  createdAt: string
  filmType?: string
  notes?: string
}

export interface PricingTier {
  id: string
  name: string
  startHour: number
  endHour: number
  rate: number
  description: string
  color: string
  sortOrder: number
  isActive: boolean
}

export interface Photographer {
  id: string
  name: string
  phone: string
  email?: string
  memberLevel: 'normal' | 'silver' | 'gold'
  totalBookings: number
  createdAt: string
}

export const MEMBER_LEVELS = {
  normal: { label: '普通会员', discountRate: 0, color: '#7A7A9D' },
  silver: { label: '银卡会员', discountRate: 0.05, color: '#C0C0C0' },
  gold: { label: '金卡会员', discountRate: 0.1, color: '#FFD700' }
} as const

export type MemberLevel = keyof typeof MEMBER_LEVELS

export interface BillOperationLog {
  id: string
  billId: string
  operation: 'create' | 'pay' | 'partial_refund' | 'full_refund' | 'cancel' | 'recalculate' | 'film_add' | 'film_remove'
  operator: string
  amount: number
  changeAmount: number
  paidAmount: number
  refundAmount: number
  balance: number
  previousStatus: BillStatus
  newStatus: BillStatus
  notes?: string
  createdAt: string
}

export interface Bill {
  id: string
  billNo: string
  bookingId?: string
  photographerId: string
  photographerName: string
  photographerLevel?: MemberLevel
  stationId?: string
  stationName?: string
  date: string
  totalHours: number
  tierBreakdown: TierBreakdownItem[]
  originalTotal: number
  stationFee: number
  filmFee: number
  memberDiscountAmount: number
  discountAmount: number
  discountRate: number
  refundAmount: number
  paidAmount: number
  total: number
  status: BillStatus
  filmRecords: FilmRecord[]
  operationLogs: BillOperationLog[]
  notes?: string
  createdAt: string
  paidAt?: string
}

export type BillStatus = 'unpaid' | 'paid' | 'refunded' | 'cancelled'

export interface Booking {
  id: string
  stationId: string
  photographerId: string
  photographerName: string
  photographerLevel?: MemberLevel
  date: string
  startTime: string
  endTime: string
  duration: number
  isMerged: boolean
  mergedFrom?: string[]
  mergedTo?: string
  status: BookingStatus
  createdAt: string
  filmType?: string
  notes?: string
}

export type BookingStatus = 'active' | 'cancelled' | 'completed'

export interface PricingCalculationResult {
  totalHours: number
  tierBreakdown: TierBreakdownItem[]
  originalTotal: number
  total: number
  currentTier: PricingTier
  nextTier?: PricingTier
  hoursToNextTier: number
  nearTierThreshold: boolean
  stationFee: number
  memberDiscountAmount: number
  discountAmount: number
  discountRate: number
}

export interface RevenueStatItem {
  id: string
  name: string
  totalRevenue: number
  totalHours: number
  billCount: number
  avgRevenuePerHour: number
}

export interface MonthlyStats {
  month: string
  totalRevenue: number
  totalHours: number
  totalBills: number
  stationStats: RevenueStatItem[]
  photographerStats: RevenueStatItem[]
  memberLevelStats: RevenueStatItem[]
  dailyStats: { date: string; revenue: number; hours: number }[]
}

export type FilmFormat = '135' | '120' | '4x5' | '8x10'
export type ProcessType = 'develop_only' | 'develop_scan' | 'develop_print'
