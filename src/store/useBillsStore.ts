import { create } from 'zustand'
import dayjs from 'dayjs'
import type {
  Bill,
  FilmRecord,
  TierBreakdownItem,
  Booking,
  MemberLevel,
  BillOperationLog,
  BillStatus,
  MonthlyStats,
  RevenueStatItem
} from '@/types'
import { mockBills } from '@/data/mockBills'
import { usePricingStore } from './usePricingStore'
import { useScheduleStore } from './useScheduleStore'
import { calculatePricing, calculateFilmPrice } from '@/utils/pricing'
import { getPhotographerByName, getMemberLevelLabel } from '@/data/mockPhotographers'

const generateBillNo = (): string => {
  const now = dayjs()
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
  return `${now.format('YYYYMMDD')}-${random}`
}

const createOpLog = (
  billId: string,
  operation: BillOperationLog['operation'],
  amount: number,
  changeAmount: number,
  previousStatus: BillStatus,
  newStatus: BillStatus,
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
  getBillById: (id: string) => Bill | undefined
  generateBill: (
    booking: Booking,
    stationName: string,
    stationHourlyRate: number,
    filmRecords?: FilmRecord[],
    extraDiscountRate?: number
  ) => Bill | null
  addFilmRecord: (billId: string, record: Omit<FilmRecord, 'id' | 'price' | 'createdAt'>) => boolean
  removeFilmRecord: (billId: string, recordId: string) => boolean
  updateBillStatus: (billId: string, status: BillStatus) => boolean
  payBill: (billId: string, amount?: number, notes?: string) => boolean
  refundBill: (billId: string, amount: number, isFullRefund: boolean, notes?: string) => boolean
  cancelBill: (billId: string, notes?: string) => boolean
  recalculateBill: (billId: string) => boolean
  getBillsByPhotographer: (photographerId: string) => Bill[]
  getBillsByStatus: (status: BillStatus) => Bill[]
  getBillsByFilter: (filter: {
    status?: BillStatus
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

const updateBillInState = (
  state: BillsState,
  billId: string,
  updater: (bill: Bill) => Bill
): { bills: Bill[]; currentBill: Bill | null } => {
  const updatedBills = state.bills.map(b => b.id === billId ? updater(b) : b)
  const updatedBill = updatedBills.find(b => b.id === billId) || null
  const updatedCurrentBill = state.currentBill?.id === billId ? updatedBill : state.currentBill
  return { bills: updatedBills, currentBill: updatedCurrentBill }
}

export const useBillsStore = create<BillsState>((set, get) => ({
  bills: mockBills,
  currentBill: null,

  setCurrentBill: (bill) => {
    set({ currentBill: bill })
  },

  getBillById: (id) => {
    return get().bills.find(b => b.id === id)
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
    const total = Math.round((totalBeforeExtra - extraDiscountAmount) * 100) / 100

    const newBill: Bill = {
      id: `BL-${Date.now()}`,
      billNo: generateBillNo(),
      bookingId: booking.id,
      photographerId: booking.photographerId,
      photographerName: booking.photographerName,
      photographerLevel: memberLevel,
      stationId: booking.stationId,
      stationName,
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
      total,
      status: 'unpaid',
      filmRecords: [...filmRecords],
      operationLogs: [
        createOpLog(
          `BL-${Date.now()}`,
          'create',
          total,
          total,
          'unpaid',
          'unpaid',
          `${getMemberLevelLabel(memberLevel)}，自动生成账单`
        )
      ],
      createdAt: dayjs().toISOString()
    }

    newBill.operationLogs[0].billId = newBill.id

    console.log('[BillsStore] 生成账单:', newBill.id, newBill.billNo, '总金额:', total)

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

    console.log('[BillsStore] 添加胶片:', newRecord.filmType, newRecord.format, '×', newRecord.quantity, '¥', price)

    set((state) => {
      const { bills: updatedBills, currentBill: updatedCurrentBill } = updateBillInState(state, billId, b => {
        const newFilmFee = b.filmFee + price
        const totalBeforeExtra = b.stationFee + newFilmFee - b.memberDiscountAmount
        const newDiscountAmount = Math.round(totalBeforeExtra * b.discountRate * 100) / 100
        const newTotal = Math.round((totalBeforeExtra - newDiscountAmount) * 100) / 100
        const newOriginalTotal = b.originalTotal + price

        const log = createOpLog(
          billId, 'film_add', newTotal, newTotal - b.total, b.status, b.status,
          `添加胶片: ${newRecord.filmType} ${newRecord.format} × ${newRecord.quantity}，¥${price}`
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

      return { bills: updatedBills, currentBill: updatedCurrentBill }
    })

    return true
  },

  removeFilmRecord: (billId, recordId) => {
    const { bills } = get()
    const bill = bills.find(b => b.id === billId)
    const record = bill?.filmRecords.find(r => r.id === recordId)
    if (!record) return false

    console.log('[BillsStore] 删除胶片:', recordId, '¥', record.price)

    set((state) => {
      const { bills: updatedBills, currentBill: updatedCurrentBill } = updateBillInState(state, billId, b => {
        const newFilmFee = b.filmFee - record.price
        const totalBeforeExtra = b.stationFee + newFilmFee - b.memberDiscountAmount
        const newDiscountAmount = Math.round(totalBeforeExtra * b.discountRate * 100) / 100
        const newTotal = Math.round((totalBeforeExtra - newDiscountAmount) * 100) / 100
        const newOriginalTotal = b.originalTotal - record.price

        const log = createOpLog(
          billId, 'film_remove', newTotal, newTotal - b.total, b.status, b.status,
          `删除胶片: ${record.filmType} × ${record.quantity}，-¥${record.price}`
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

      return { bills: updatedBills, currentBill: updatedCurrentBill }
    })

    return true
  },

  updateBillStatus: (billId, status) => {
    console.log('[BillsStore] 更新账单状态:', billId, '→', status)

    set((state) => {
      const { bills: updatedBills, currentBill: updatedCurrentBill } = updateBillInState(state, billId, b => ({
        ...b,
        status,
        paidAt: status === 'paid' ? dayjs().toISOString() : b.paidAt
      }))

      return { bills: updatedBills, currentBill: updatedCurrentBill }
    })

    return true
  },

  payBill: (billId, amount, notes = '前台收款') => {
    const bill = get().bills.find(b => b.id === billId)
    if (!bill || bill.status !== 'unpaid') return false

    const payAmount = amount ?? bill.total
    const log = createOpLog(billId, 'pay', payAmount, payAmount, 'unpaid', 'paid', notes)

    console.log('[BillsStore] 账单收款:', billId, '金额:', payAmount)

    set((state) => {
      const { bills: updatedBills, currentBill: updatedCurrentBill } = updateBillInState(state, billId, b => ({
        ...b,
        status: 'paid' as BillStatus,
        paidAt: dayjs().toISOString(),
        operationLogs: [...b.operationLogs, log]
      }))

      return { bills: updatedBills, currentBill: updatedCurrentBill }
    })

    return true
  },

  refundBill: (billId, amount, isFullRefund, notes = '') => {
    const bill = get().bills.find(b => b.id === billId)
    if (!bill) return false

    const canRefundFromStatuses: BillStatus[] = ['paid', 'refunded']
    if (!canRefundFromStatuses.includes(bill.status)) return false

    const alreadyRefunded = bill.refundAmount || 0
    const maxRefundable = bill.total - alreadyRefunded
    if (amount <= 0 || amount > maxRefundable) return false

    const operation = isFullRefund ? 'full_refund' as const : 'partial_refund' as const
    const newRefundAmount = alreadyRefunded + amount
    const isFullyRefundedNow = newRefundAmount >= bill.total
    const newStatus: BillStatus = isFullyRefundedNow ? 'refunded' : bill.status
    const logNotes = isFullRefund
      ? `全额退款 ¥${amount}`
      : `部分退款 ¥${amount}（累计已退 ¥${newRefundAmount}）`

    const log = createOpLog(
      billId, operation, amount, -amount,
      bill.status, newStatus,
      notes || logNotes
    )

    console.log('[BillsStore] 账单退款:', {
      billId, amount, isFullRefund,
      previousRefund: alreadyRefunded,
      newRefundAmount,
      newStatus
    })

    const { cancelBooking } = useScheduleStore.getState()
    if (isFullyRefundedNow && bill.bookingId) {
      cancelBooking(bill.bookingId)
      console.log('[BillsStore] 全额退款完成，释放工位:', bill.bookingId)
    }

    set((state) => {
      const { bills: updatedBills, currentBill: updatedCurrentBill } = updateBillInState(state, billId, b => ({
        ...b,
        status: newStatus,
        refundAmount: newRefundAmount,
        operationLogs: [...b.operationLogs, log]
      }))

      return { bills: updatedBills, currentBill: updatedCurrentBill }
    })

    return true
  },

  cancelBill: (billId, notes = '用户取消') => {
    const bill = get().bills.find(b => b.id === billId)
    if (!bill || bill.status === 'cancelled') return false

    const { cancelBooking } = useScheduleStore.getState()

    if (bill.status === 'unpaid') {
      const log = createOpLog(billId, 'cancel', 0, -bill.total, bill.status, 'cancelled', notes)

      if (bill.bookingId) {
        cancelBooking(bill.bookingId)
        console.log('[BillsStore] 取消未支付账单，释放工位:', bill.bookingId)
      }

      console.log('[BillsStore] 取消未支付账单:', billId)

      set((state) => {
        const { bills: updatedBills, currentBill: updatedCurrentBill } = updateBillInState(state, billId, b => ({
          ...b,
          status: 'cancelled' as BillStatus,
          refundAmount: b.total,
          operationLogs: [...b.operationLogs, log]
        }))

        return { bills: updatedBills, currentBill: updatedCurrentBill }
      })

      return true
    }

    if (bill.status === 'paid' || bill.status === 'refunded') {
      const alreadyRefunded = bill.refundAmount || 0
      const refundRemaining = bill.total - alreadyRefunded

      if (refundRemaining <= 0) return false

      const log = createOpLog(
        billId, 'cancel', refundRemaining, -refundRemaining,
        bill.status, 'cancelled',
        `${notes}，全额退款 ¥${refundRemaining}${alreadyRefunded > 0 ? `（含之前已退 ¥${alreadyRefunded}）` : ''}`
      )

      if (bill.bookingId) {
        cancelBooking(bill.bookingId)
        console.log('[BillsStore] 取消已支付账单，全额退款并释放工位:', bill.bookingId)
      }

      console.log('[BillsStore] 取消已支付账单:', billId, '退款:', refundRemaining)

      set((state) => {
        const { bills: updatedBills, currentBill: updatedCurrentBill } = updateBillInState(state, billId, b => ({
          ...b,
          status: 'cancelled' as BillStatus,
          refundAmount: b.total,
          operationLogs: [...b.operationLogs, log]
        }))

        return { bills: updatedBills, currentBill: updatedCurrentBill }
      })

      return true
    }

    return false
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
      bill.totalHours, tiers,
      bill.photographerLevel || 'normal',
      hourlyRate, bill.discountRate
    )

    const tierBreakdown: TierBreakdownItem[] = pricingResult.tierBreakdown.map(item => ({
      ...item,
      amount: Math.round(item.amount * 100) / 100
    }))

    const totalBeforeExtra = pricingResult.stationFee + bill.filmFee - pricingResult.memberDiscountAmount
    const extraDiscountAmount = Math.round(totalBeforeExtra * bill.discountRate * 100) / 100
    const newTotal = Math.round((totalBeforeExtra - extraDiscountAmount) * 100) / 100
    const newOriginalTotal = pricingResult.originalTotal + bill.filmFee
    const change = newTotal - bill.total

    const log = createOpLog(
      billId, 'recalculate', newTotal, change, bill.status, bill.status,
      `重新计价：${change >= 0 ? '+' : ''}¥${Math.abs(change).toFixed(2)}`
    )

    console.log('[BillsStore] 重新计价:', billId, '变化:', change)

    set((state) => {
      const { bills: updatedBills, currentBill: updatedCurrentBill } = updateBillInState(state, billId, b => ({
        ...b,
        tierBreakdown,
        originalTotal: newOriginalTotal,
        stationFee: pricingResult.stationFee,
        memberDiscountAmount: pricingResult.memberDiscountAmount,
        discountAmount: extraDiscountAmount,
        total: newTotal,
        operationLogs: [...b.operationLogs, log]
      }))

      return { bills: updatedBills, currentBill: updatedCurrentBill }
    })

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

    if (filter.status) result = result.filter(b => b.status === filter.status)
    if (filter.stationId) result = result.filter(b => b.stationId === filter.stationId)
    if (filter.photographerId) result = result.filter(b => b.photographerId === filter.photographerId)
    if (filter.memberLevel) result = result.filter(b => b.photographerLevel === filter.memberLevel)
    if (filter.startDate) result = result.filter(b => b.date >= filter.startDate!)
    if (filter.endDate) result = result.filter(b => b.date <= filter.endDate!)

    return result.sort((a, b) => dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf())
  },

  getTotalRevenue: () => {
    return get().bills
      .filter(b => b.status === 'paid')
      .reduce((sum, b) => sum + b.total - (b.refundAmount || 0), 0)
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

    const monthBills = bills.filter(b => b.date.startsWith(month))

    const dailyStatsMap = new Map<string, { revenue: number; hours: number }>()

    monthBills.forEach(bill => {
      const actualRevenue = bill.status === 'paid'
        ? bill.total - (bill.refundAmount || 0)
        : (bill.status === 'unpaid' ? 0 : 0)
      const key = bill.date
      const existing = dailyStatsMap.get(key) || { revenue: 0, hours: 0 }
      dailyStatsMap.set(key, {
        revenue: existing.revenue + actualRevenue,
        hours: existing.hours + bill.totalHours
      })
    })

    const dailyStats = Array.from(dailyStatsMap.entries())
      .map(([date, stats]) => ({ date, ...stats }))
      .sort((a, b) => a.date.localeCompare(b.date))

    const calcActualRevenue = (billsArr: Bill[]) =>
      billsArr.reduce((sum, b) => {
        if (b.status === 'paid') return sum + b.total - (b.refundAmount || 0)
        return sum
      }, 0)

    const stationStats: RevenueStatItem[] = stations.map(station => {
      const stationBills = monthBills.filter(b => b.stationId === station.id)
      const totalRevenue = calcActualRevenue(stationBills)
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
      const totalRevenue = calcActualRevenue(phBills)
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
      const totalRevenue = calcActualRevenue(levelBills)
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

    const totalRevenue = calcActualRevenue(monthBills)
    const totalHours = monthBills.reduce((sum, b) => sum + b.totalHours, 0)

    return {
      month,
      totalRevenue,
      totalHours,
      totalBills: monthBills.filter(b => b.status !== 'cancelled').length,
      stationStats,
      photographerStats,
      memberLevelStats,
      dailyStats
    }
  }
}))
