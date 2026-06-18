import { create } from 'zustand'
import dayjs from 'dayjs'
import type { Bill, FilmRecord, TierBreakdownItem, Booking } from '@/types'
import { mockBills } from '@/data/mockBills'
import { usePricingStore } from './usePricingStore'
import { calculateFilmPrice } from '@/data/mockFilms'

interface BillsState {
  bills: Bill[]
  currentBill: Bill | null
  setCurrentBill: (bill: Bill | null) => void
  generateBill: (
    booking: Booking,
    filmRecords?: FilmRecord[],
    discountRate?: number
  ) => Bill | null
  addFilmRecord: (billId: string, record: FilmRecord) => boolean
  removeFilmRecord: (billId: string, recordId: string) => boolean
  updateBillStatus: (billId: string, status: Bill['status']) => boolean
  getBillsByPhotographer: (photographerId: string) => Bill[]
  getBillsByStatus: (status: Bill['status']) => Bill[]
  getTotalRevenue: () => number
  getUnpaidAmount: () => number
  recalculateBill: (billId: string) => void
}

const generateBillNo = (): string => {
  const now = dayjs()
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
  return `${now.format('YYYYMMDD')}-${random}`
}

export const useBillsStore = create<BillsState>((set, get) => ({
  bills: mockBills,
  currentBill: null,

  setCurrentBill: (bill) => {
    set({ currentBill: bill })
  },

  generateBill: (booking, filmRecords = [], discountRate = 0) => {
    const { calculate } = usePricingStore.getState()

    const pricingResult = calculate(booking.duration)

    const tierBreakdown: TierBreakdownItem[] = pricingResult.tierBreakdown.map(item => ({
      ...item,
      amount: Math.round(item.amount * 100) / 100
    }))

    const stationFee = pricingResult.stationFee
    const filmFee = filmRecords.reduce((sum, r) => sum + r.price, 0)
    const discountAmount = Math.round((stationFee + filmFee) * discountRate * 100) / 100
    const total = stationFee + filmFee - discountAmount

    const newBill: Bill = {
      id: `BL-${Date.now()}`,
      billNo: generateBillNo(),
      bookingId: booking.id,
      photographerId: booking.photographerId,
      photographerName: booking.photographerName,
      stationId: booking.stationId,
      date: booking.date,
      totalHours: booking.duration,
      tierBreakdown,
      stationFee,
      filmFee,
      discountAmount,
      discountRate,
      total,
      status: 'unpaid',
      filmRecords: [...filmRecords],
      createdAt: dayjs().toISOString()
    }

    console.log('[BillsStore] 生成账单:', newBill.id, '金额:', total)

    set((state) => ({
      bills: [...state.bills, newBill],
      currentBill: newBill
    }))

    return newBill
  },

  addFilmRecord: (billId, record) => {
    console.log('[BillsStore] 添加胶片记录:', record.id, '价格:', record.price)

    set((state) => ({
      bills: state.bills.map(bill => {
        if (bill.id !== billId) return bill
        const updatedBill = {
          ...bill,
          filmRecords: [...bill.filmRecords, record],
          filmFee: bill.filmFee + record.price,
          discountAmount: Math.round((bill.stationFee + bill.filmFee + record.price) * bill.discountRate * 100) / 100,
          total: bill.stationFee + bill.filmFee + record.price - bill.discountAmount
        }
        return updatedBill
      }),
      currentBill: state.currentBill?.id === billId
        ? {
            ...state.currentBill,
            filmRecords: [...state.currentBill.filmRecords, record],
            filmFee: state.currentBill.filmFee + record.price,
            total: state.currentBill.stationFee + state.currentBill.filmFee + record.price - state.currentBill.discountAmount
          }
        : state.currentBill
    }))

    return true
  },

  removeFilmRecord: (billId, recordId) => {
    const { bills } = get()
    const bill = bills.find(b => b.id === billId)
    const record = bill?.filmRecords.find(r => r.id === recordId)

    if (!record) return false

    console.log('[BillsStore] 删除胶片记录:', recordId)

    set((state) => ({
      bills: state.bills.map(b => {
        if (b.id !== billId) return b
        return {
          ...b,
          filmRecords: b.filmRecords.filter(r => r.id !== recordId),
          filmFee: b.filmFee - record.price,
          discountAmount: Math.round((b.stationFee + b.filmFee - record.price) * b.discountRate * 100) / 100,
          total: b.stationFee + b.filmFee - record.price - b.discountAmount
        }
      }),
      currentBill: state.currentBill?.id === billId
        ? {
            ...state.currentBill,
            filmRecords: state.currentBill.filmRecords.filter(r => r.id !== recordId),
            filmFee: state.currentBill.filmFee - record.price,
            total: state.currentBill.stationFee + state.currentBill.filmFee - record.price - state.currentBill.discountAmount
          }
        : state.currentBill
    }))

    return true
  },

  updateBillStatus: (billId, status) => {
    console.log('[BillsStore] 更新账单状态:', billId, '→', status)

    set((state) => ({
      bills: state.bills.map(b =>
        b.id === billId
          ? {
              ...b,
              status,
              paidAt: status === 'paid' ? dayjs().toISOString() : b.paidAt
            }
          : b
      ),
      currentBill: state.currentBill?.id === billId
        ? {
            ...state.currentBill,
            status,
            paidAt: status === 'paid' ? dayjs().toISOString() : state.currentBill.paidAt
          }
        : state.currentBill
    }))

    return true
  },

  getBillsByPhotographer: (photographerId) => {
    return get().bills.filter(b => b.photographerId === photographerId)
      .sort((a, b) => dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf()
  },

  getBillsByStatus: (status) => {
    return get().bills.filter(b => b.status === status)
      .sort((a, b) => dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf()
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

  recalculateBill: (billId) => {
    const { bills } = get()
    const bill = bills.find(b => b.id === billId)
    if (!bill) return

    const { calculate } = usePricingStore.getState()
    const pricingResult = calculate(bill.totalHours)

    const tierBreakdown: TierBreakdownItem[] = pricingResult.tierBreakdown.map(item => ({
      ...item,
      amount: Math.round(item.amount * 100) / 100
    }))

    const stationFee = pricingResult.stationFee
    const filmFee = bill.filmRecords.reduce((sum, r) => sum + r.price, 0)
    const discountAmount = Math.round((stationFee + filmFee) * bill.discountRate * 100) / 100
    const total = stationFee + filmFee - discountAmount

    console.log('[BillsStore] 重新计算账单:', billId, '新总额:', total)

    set((state) => ({
      bills: state.bills.map(b =>
        b.id === billId
          ? { ...b, tierBreakdown, stationFee, filmFee, discountAmount, total }
          : b
      )
    }))
  }
}))
