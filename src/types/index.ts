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

export interface Bill {
  id: string
  billNo: string
  bookingId?: string
  photographerId: string
  photographerName: string
  stationId?: string
  stationName?: string
  date: string
  totalHours: number
  tierBreakdown: TierBreakdownItem[]
  stationFee: number
  filmFee: number
  discountAmount: number
  discountRate: number
  total: number
  status: 'unpaid' | 'paid' | 'cancelled'
  filmRecords: FilmRecord[]
  notes?: string
  createdAt: string
  paidAt?: string
}

export interface TierBreakdownItem {
  tierId: string
  tierName: string
  hours: number
  rate: number
  amount: number
}

export interface FilmRecord {
  id: string
  filmType: string
  format: '135' | '120' | '4x5' | '8x10' | string
  processType: 'C-41' | 'E-6' | '黑白' | '黑白反转' | '扫描' | string
  quantity: number
  price: number
  notes?: string
  createdAt: string
}

export interface Photographer {
  id: string
  name: string
  phone: string
  email?: string
  memberLevel: 'normal' | 'silver' | 'gold' | 'platinum'
  discountRate: number
  totalBookings: number
  createdAt: string
}

export interface BookingMergeResult {
  success: boolean
  mergedBooking?: Booking
  mergedSlots?: string[]
  message?: string
}

export interface BookingSplitResult {
  success: boolean
  newBookings?: Booking[]
  updatedSlots?: string[]
  message?: string
}

export interface PricingCalculationResult {
  totalHours: number
  tierBreakdown: TierBreakdownItem[]
  total: number
  currentTier: PricingTier
  nextTier?: PricingTier
  hoursToNextTier: number
  nearTierThreshold: boolean
  stationFee: number
  discountAmount: number
  discountRate: number
}

export type BookingStatus = 'active' | 'cancelled' | 'completed'
export type BillStatus = 'unpaid' | 'paid' | 'cancelled'
export type FilmFormat = '35mm' | '120' | '4x5' | '8x10'
export type ProcessType = 'develop_only' | 'develop_scan' | 'develop_print'
