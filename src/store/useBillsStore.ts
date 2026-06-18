import { create } from 'zustand'
import dayjs from 'dayjs'
import type {
  Bill,
  FilmRecord,
  TierBreakdownItem,
  Booking,
  MemberLevel,
  BillOperationLog,
  MonthlyStats,
  RevenueStatItem
} from '@/types'
import { mockBills, getBillStatusLabel } from '@/data/mockBills'
import { usePricingStore } from './usePricingStore'
import { useScheduleStore } from './useScheduleStore'
import { calculatePricing, calculateFilmPrice } from '@/utils/pricing'
import { getPhotographerByName } from '@/data/mockPhotographers'
import { getMemberLevelLabel } from '@/data/mockPhotographers'

const generateBillNo = (): string => {
  const now = dayjs()
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
  return `${now.format('YYYYMMDD')}-${random}`
}

const createOperationLog = (
  billId: string,
  operation: BillOperationLog['operation'],
  amount: number,
  changeAmount: number,
  previousStatus: Bill['status'],
  newStatus: Bill['status'],
  notes?: string,
  operator: string = '前台'
): BillOperationLog => ({
  id: `LOG-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  billId,
  operation,
  operator,
  amount,
  changeAmount,
  previousStatus,
  newStatus,
  notes,
  createdAt: dayjs().toISOString()
})

interface BillsState {
  bills: Bill[]
  currentBill: Bill | null
  setCurrentBill: (bill: Bill | null) => void
  generateBill: (
    booking: Booking,
    stationName: string,
    stationHourlyRate: number,
    filmRecords?: FilmRecord[],
    extraDiscountRate?: number
  ) => Bill | null
  addFilmRecord: (billId: string, record: Omit<FilmRecord, 'id' | 'price' | 'createdAt'>) => boolean
  removeFilmRecord: (billId: string, recordId: string) => boolean
  updateBillStatus: (billId: string, status: Bill['status']) => boolean
  payBill: (billId: string, amount?: number, notes?: string) => boolean
  refundBill: (billId: string, amount: number, isFullRefund: boolean, notes?: string) => boolean
  cancelBill: (billId: string, notes?: string) => boolean
  recalculateBill: (billId: string) => boolean
  getBillsByPhotographer: (photographerId: string) => Bill[]
  getBillsByStatus: (status: Bill['status']) => Bill[]
  getBillsByFilter: (filter: {
    status?: Bill['status']
    stationId?: string
    photographerId?: string
    memberLevel?: MemberLevel
    startDate?: string
    endDate?: string
  }) => Bill[]
  getTotalRevenue: () => number
  getUnpaidAmount: () => number
  getMonthlyStats: (month: string) => MonthlyStats
}

export const useBillsStore = create<BillsState>((set, get) => ({
  bills: mockBills,
  currentBill: null,

  setCurrentBill: (bill) => {
    set({ currentBill: bill })
  },

  generateBill: (booking, stationName, stationHourlyRate, filmRecords = [], extraDiscountRate = 0) => {
    const { calculate } = usePricingStore.getState()
    const { getStationById } = useScheduleStore.getState()

    const photographer = getPhotographerByName(booking.photographerName)
    const memberLevel: MemberLevel = booking.photographerLevel || photographer?.memberLevel || 'normal'
    const station = getStationById(booking.stationId)
    const hourlyRate = stationHourlyRate || station?.hourlyRate || 80

    const pricingResult = calculate(booking.duration, memberLevel, hourlyRate, extraDiscountRate)

    const tierBreakdown: TierBreakdownItem[] = pricingResult.tierBreakdown.map(item => ({
      ...item,
      amount: Math.round(item.amount * 100) / 100
    }))

    const filmFee = filmRecords.reduce((sum, r) => sum + r.price, 0)
    const totalBeforeExtra = pricingResult.stationFee + filmFee - pricingResult.memberDiscountAmount
    const extraDiscountAmount = Math.round(totalBeforeExtra * extraDiscountRate * 100) / 100

    const newBill: Bill = {
      id: `BL-${Date.now()}`,
      billNo: generateBillNo(),
      bookingId: booking.id,
      photographerId: booking.photographerId,
      photographerName: booking.photographerName,
      photographerLevel: memberLevel,
      stationId: booking.stationId,
      stationName: stationName,
      date: booking.date,
      totalHours: booking.duration,
      tierBreakdown,
      originalTotal: pricingResult.originalTotal + filmFee,
      stationFee: pricingResult.stationFee,
      filmFee,
      memberDiscountAmount: pricingResult.memberDiscountAmount,
      discountAmount: extraDiscountAmount,
      discountRate: extraDiscountRate,
      refundAmount: 0,
      total: Math.round((totalBeforeExtra - extraDiscountAmount) * 100) / 100,
      status: 'unpaid',
      filmRecords: [...filmRecords],
      operationLogs: [
        createOperationLog(
          `BL-${Date.now()}`,
          'create',
          Math.round((totalBeforeExtra - extraDiscountAmount) * 100) / 100,
          Math.round((totalBeforeExtra - extraDiscountAmount) * 100) / 100,
          'unpaid',
          'unpaid',
          `${getMemberLevelLabel(memberLevel)}，自动生成账单`
        )
      ],
      createdAt: dayjs().toISOString()
    }

    newBill.operationLogs[0].billId = newBill.id

    console.log('[BillsStore] 生成账单:', {
      id: newBill.id,
      billNo: newBill.billNo,
      memberLevel,
      station: stationName,
      hourlyRate,
      hours: booking.duration,
      stationFee: pricingResult.stationFee,
      filmFee,
      memberDiscount: pricingResult.memberDiscountAmount,
      extraDiscount: extraDiscountAmount,
      total: newBill.total
    })

    set((state) => ({
      bills: [...state.bills, newBill],
      currentBill: newBill
    }))

    return newBill
  },

  addFilmRecord: (billId, recordData) => {
    const { bills } = get()
    const bill = bills.find(b => b.id === billId)
    if (!bill) return false

    const price = calculateFilmPrice(
      recordData.filmType,
      recordData.processType,
      recordData.quantity,
      recordData.format
    )

    const newRecord: FilmRecord = {
      id: `FR-${Date.now()}`,
      ...recordData,
      price,
      createdAt: dayjs().toISOString()
    }

    console.log('[BillsStore] 添加胶片记录:', {
      id: newRecord.id,
      filmType: newRecord.filmType,
      format: newRecord.format,
      quantity: newRecord.quantity,
      price
    })

    set((state) => {
      const updatedBills = state.bills.map(b => {
        if (b.id !== billId) return b
        const newFilmFee = b.filmFee + price
        const totalBeforeExtra = b.stationFee + newFilmFee - b.memberDiscountAmount
        const newDiscountAmount = Math.round(totalBeforeExtra * b.discountRate * 100) / 100
        const newTotal = Math.round((totalBeforeExtra - newDiscountAmount) * 100) / 100
        const newOriginalTotal = b.originalTotal + price

        const log = createOperationLog(
          billId,
          'update',
          newTotal,
          newTotal - b.total,
          b.status,
          b.status,
          `添加胶片: ${newRecord.filmType} × ${newRecord.quantity}`
        )

        return {
          ...b,
          filmRecords: [...b.filmRecords, newRecord],
          filmFee: newFilmFee,
          discountAmount: newDiscountAmount,
          originalTotal: newOriginalTotal,
          total: newTotal,
          operationLogs: [...b.operationLogs, log]
        }
      })

      let updatedCurrentBill = state.currentBill
      if (state.currentBill?.id === billId) {
        const updated = updatedBills.find(b => b.id === billId)
        if (updated) updatedCurrentBill = updated
      }

      return {
        bills: updatedBills,
        currentBill: updatedCurrentBill
      }
    })

    return true
  },

  removeFilmRecord: (billId, recordId) => {
    const { bills } = get()
    const bill = bills.find(b => b.id === billId)
    const record = bill?.filmRecords.find(r => r.id === recordId)

    if (!record) return false

    console.log('[BillsStore] 删除胶片记录:', recordId, '价格:', record.price)

    set((state) => {
      const updatedBills = state.bills.map(b => {
        if (b.id !== billId) return b
        const newFilmFee = b.filmFee - record.price
        const totalBeforeExtra = b.stationFee + newFilmFee - b.memberDiscountAmount
        const newDiscountAmount = Math.round(totalBeforeExtra * b.discountRate * 100) / 100
        const newTotal = Math.round((totalBeforeExtra - newDiscountAmount) * 100) / 100
        const newOriginalTotal = b.originalTotal - record.price

        const log = createOperationLog(
          billId,
          'update',
          newTotal,
          newTotal - b.total,
          b.status,
          b.status,
          `删除胶片: ${record.filmType} × ${record.quantity}`
        )

        return {
          ...b,
          filmRecords: b.filmRecords.filter(r => r.id !== recordId),
          filmFee: newFilmFee,
          discountAmount: newDiscountAmount,
          originalTotal: newOriginalTotal,
          total: newTotal,
          operationLogs: [...b.operationLogs, log]
        }
      })

      let updatedCurrentBill = state.currentBill
      if (state.currentBill?.id === billId) {
        const updated = updatedBills.find(b => b.id === billId)
        if (updated) updatedCurrentBill = updated
      }

      return {
        bills: updatedBills,
        currentBill: updatedCurrentBill
      }
    })

    return true
  },

  updateBillStatus: (billId, status) => {
    console.log('[BillsStore] 更新账单状态:', billId, '→', status)

    set((state) => ({
      bills: state.bills.map(b =>
        b.id === billId
          ? { ...b, status, paidAt: status === 'paid' ? dayjs().toISOString() : b.paidAt }
          : b
      ),
      currentBill: state.currentBill?.id === billId
        ? { ...state.currentBill, status, paidAt: status === 'paid' ? dayjs().toISOString() : state.currentBill.paidAt }
        : state.currentBill
    }))

    return true
  },

  payBill: (billId, amount, notes = '前台收款') => {
    const bill = get().bills.find(b => b.id === billId)
    if (!bill || bill.status !== 'unpaid') return false

    const payAmount = amount ?? bill.total
    const log = createOperationLog(
      billId,
      'pay',
      payAmount,
      payAmount,
      'unpaid',
      'paid',
      notes
    )

    console.log('[BillsStore] 账单收款:', billId, '金额:', payAmount)

    set((state) => ({
      bills: state.bills.map(b =>
        b.id === billId
          ? { ...b, status: 'paid', paidAt: dayjs().toISOString(), operationLogs: [...b.operationLogs, log] }
          : b
      ),
      currentBill: state.currentBill?.id === billId
        ? { ...state.currentBill, status: 'paid', paidAt: dayjs().toISOString(), operationLogs: [...state.currentBill.operationLogs, log] }
        : state.currentBill
    }))

    return true
  },

  refundBill: (billId, amount, isFullRefund, notes = '') => {
    const bill = get().bills.find(b => b.id === billId)
    if (!bill || bill.status !== 'paid') return false
    if (amount <= 0 || amount > bill.total) return false

    const { cancelBooking } = useScheduleStore.getState()

    const operation = isFullRefund ? 'full_refund' : 'partial_refund'
    const newStatus: Bill['status'] = isFullRefund ? 'refunded' : 'refunded'
    const logNotes = isFullRefund ? `全额退款: ¥${amount}` : `部分退款: ¥${amount}`

    const log = createOperationLog(
      billId,
      operation,
      amount,
      -amount,
      'paid',
      newStatus,
      `${notes || logNotes}`
    )

    const newRefundAmount = bill.refundAmount + amount
    const newTotal = bill.total - amount

    console.log('[BillsStore] 账单退款:', {
      billId,
      amount,
      isFullRefund,
      previousRefund: bill.refundAmount,
      newRefundAmount,
      previousTotal: bill.total,
      newTotal
    })

    if (bill.bookingId && isFullRefund) {
      cancelBooking(bill.bookingId)
      console.log('[BillsStore] 已释放工位占用:', bill.bookingId)
    }

    set((state) => ({
      bills: state.bills.map(b =>
        b.id === billId
          ? {
              ...b,
              status: newStatus,
              refundAmount: newRefundAmount,
              total: Math.max(0, newTotal),
              operationLogs: [...b.operationLogs, log]
            }
          : b
      ),
      currentBill: state.currentBill?.id === billId
        ? {
            ...state.currentBill,
            status: newStatus,
            refundAmount: newRefundAmount,
            total: Math.max(0, newTotal),
            operationLogs: [...state.currentBill.operationLogs, log]
          }
        : state.currentBill
    }))

    return true
  },

  cancelBill: (billId, notes = '用户取消') => {
    const bill = get().bills.find(b => b.id === billId)
    if (!bill || bill.status === 'cancelled' || bill.status === 'paid' || bill.status === 'refunded') return false

    const { cancelBooking } = useScheduleStore.getState()

    const log = createOperationLog(
      billId,
      'cancel',
      0,
      -bill.total,
      bill.status,
      'cancelled',
      notes
    )

    if (bill.bookingId) {
      cancelBooking(bill.bookingId)
      console.log('[BillsStore] 已释放工位占用:', bill.bookingId)
    }

    console.log('[BillsStore] 取消账单:', billId, '原金额:', bill.total)

    set((state) => ({
      bills: state.bills.map(b =>
        b.id === billId
          ? { ...b, status: 'cancelled', total: 0, operationLogs: [...b.operationLogs, log] }
          : b
      ),
      currentBill: state.currentBill?.id === billId
        ? { ...state.currentBill, status: 'cancelled', total: 0, operationLogs: [...state.currentBill.operationLogs, log] }
        : state.currentBill
    }))

    return true
  },

  recalculateBill: (billId) => {
    const { bills } = get()
    const bill = bills.find(b => b.id === billId)
    if (!bill) return false

    const { tiers } = usePricingStore.getState()
    const { getStationById } = useScheduleStore.getState()

    const station = getStationById(bill.stationId || '')
    const hourlyRate = station?.hourlyRate || 80

    const pricingResult = calculatePricing(
      bill.totalHours,
      tiers,
      bill.photographerLevel || 'normal',
      hourlyRate,
      bill.discountRate
    )

    const tierBreakdown: TierBreakdownItem[] = pricingResult.tierBreakdown.map(item => ({
      ...item,
      amount: Math.round(item.amount * 100) / 100
    }))

    const totalBeforeExtra = pricingResult.stationFee + bill.filmFee - pricingResult.memberDiscountAmount
    const extraDiscountAmount = Math.round(totalBeforeExtra * bill.discountRate * 100) / 100
    const newTotal = Math.round((totalBeforeExtra - extraDiscountAmount) * 100) / 100
    const newOriginalTotal = pricingResult.originalTotal + bill.filmFee

    const log = createOperationLog(
      billId,
      'update',
      newTotal,
      newTotal - bill.total,
      bill.status,
      bill.status,
      '重新计价'
    )

    console.log('[BillsStore] 重新计价:', {
      billId,
      previousTotal: bill.total,
      newTotal,
      change: newTotal - bill.total,
      station: station?.name,
      hourlyRate,
      hours: bill.totalHours
    })

    set((state) => ({
      bills: state.bills.map(b =>
        b.id === billId
          ? {
              ...b,
              tierBreakdown,
              originalTotal: newOriginalTotal,
              stationFee: pricingResult.stationFee,
              memberDiscountAmount: pricingResult.memberDiscountAmount,
              discountAmount: extraDiscountAmount,
              total: newTotal,
              operationLogs: [...b.operationLogs, log]
            }
          : b
      ),
      currentBill: state.currentBill?.id === billId
        ? {
            ...state.currentBill,
            tierBreakdown,
            originalTotal: newOriginalTotal,
            stationFee: pricingResult.stationFee,
            memberDiscountAmount: pricingResult.memberDiscountAmount,
            discountAmount: extraDiscountAmount,
            total: newTotal,
            operationLogs: [...state.currentBill.operationLogs, log]
          }
        : state.currentBill
    }))

    return true
  },

  getBillsByPhotographer: (photographerId) => {
    return get().bills.filter(b => b.photographerId === photographerId)
      .sort((a, b) => dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf())
  },

  getBillsByStatus: (status) => {
    return get().bills.filter(b => b.status === status)
      .sort((a, b) => dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf())
  },

  getBillsByFilter: (filter) => {
    let result = [...get().bills]

    if (filter.status) {
      result = result.filter(b => b.status === filter.status)
    }
    if (filter.stationId) {
      result = result.filter(b => b.stationId === filter.stationId)
    }
    if (filter.photographerId) {
      result = result.filter(b => b.photographerId === filter.photographerId)
    }
    if (filter.memberLevel) {
      result = result.filter(b => b.photographerLevel === filter.memberLevel)
    }
    if (filter.startDate) {
      result = result.filter(b => b.date >= filter.startDate!)
    }
    if (filter.endDate) {
      result = result.filter(b => b.date <= filter.endDate!)
    }

    return result.sort((a, b) => dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf())
  },

  getTotalRevenue: () => {
    return get().bills
      .filter(b => b.status === 'paid')
      .reduce((sum, b) => sum + b.total, 0)
  },

  getUnpaidAmount: () => {
    return get().bills
      .filter(b => b.status === 'unpaid')
      .reduce((sum, b) => sum + b.total, 0)
  },

  getMonthlyStats: (month) => {
    const { bills } = get()
    const { stations } = useScheduleStore.getState()
    const photographers = [
      { id: 'PH-001', name: '张明' },
      { id: 'PH-002', name: '李华' },
      { id: 'PH-003', name: '王芳' },
      { id: 'PH-004', name: '赵强' },
      { id: 'PH-005', name: '陈静' }
    ]
    const memberLevels: MemberLevel[] = ['normal', 'silver', 'gold']

    const monthBills = bills.filter(b =>
      b.date.startsWith(month) && b.status !== 'cancelled'
    )

    const dailyStatsMap = new Map<string, { revenue: number; hours: number }>()

    monthBills.forEach(bill => {
      const key = bill.date
      const existing = dailyStatsMap.get(key) || { revenue: 0, hours: 0 }
      dailyStatsMap.set(key, {
        revenue: existing.revenue + bill.total,
        hours: existing.hours + bill.totalHours
      })
    })

    const dailyStats = Array.from(dailyStatsMap.entries())
      .map(([date, stats]) => ({ date, ...stats }))
      .sort((a, b) => a.date.localeCompare(b.date))

    const stationStats: RevenueStatItem[] = stations.map(station => {
      const stationBills = monthBills.filter(b => b.stationId === station.id)
      const totalRevenue = stationBills.reduce((sum, b) => sum + b.total, 0)
      const totalHours = stationBills.reduce((sum, b) => sum + b.totalHours, 0)
      const billCount = stationBills.length
      return {
        id: station.id,
        name: station.name,
        totalRevenue,
        totalHours,
        billCount,
        avgRevenuePerHour: totalHours > 0 ? Math.round(totalRevenue / totalHours * 100) / 100 : 0
      }
    }).filter(s => s.billCount > 0)

    const photographerStats: RevenueStatItem[] = photographers.map(ph => {
      const phBills = monthBills.filter(b => b.photographerId === ph.id)
      const totalRevenue = phBills.reduce((sum, b) => sum + b.total, 0)
      const totalHours = phBills.reduce((sum, b) => sum + b.totalHours, 0)
      const billCount = phBills.length
      return {
        id: ph.id,
        name: ph.name,
        totalRevenue,
        totalHours,
        billCount,
        avgRevenuePerHour: totalHours > 0 ? Math.round(totalRevenue / totalHours * 100) / 100 : 0
      }
    }).filter(s => s.billCount > 0)

    const memberLevelStats: RevenueStatItem[] = memberLevels.map(level => {
      const levelBills = monthBills.filter(b => b.photographerLevel === level)
      const totalRevenue = levelBills.reduce((sum, b) => sum + b.total, 0)
      const totalHours = levelBills.reduce((sum, b) => sum + b.totalHours, 0)
      const billCount = levelBills.length
      return {
        id: level,
        name: getMemberLevelLabel(level),
        totalRevenue,
        totalHours,
        billCount,
        avgRevenuePerHour: totalHours > 0 ? Math.round(totalRevenue / totalHours * 100) / 100 : 0
      }
    })

    const totalRevenue = monthBills
      .filter(b => b.status === 'paid')
      .reduce((sum, b) => sum + b.total, 0)

    const totalHours = monthBills.reduce((sum, b) => sum + b.totalHours, 0)

    return {
      month,
      totalRevenue,
      totalHours,
      totalBills: monthBills.length,
      stationStats,
      photographerStats,
      memberLevelStats,
      dailyStats
    }
  }
}))
