import { create } from 'zustand'
import dayjs from 'dayjs'
import type { Station, Booking, TimeSlot, MemberLevel } from '@/types'
import { mockStations } from '@/data/mockStations'
import { mockBookings } from '@/data/mockBookings'
import { generateTimeSlots, mergeBookings, splitBooking, calculateDuration } from '@/utils/booking'

interface ScheduleState {
  stations: Station[]
  bookings: Booking[]
  selectedDate: string
  selectedStation: Station | null
  selectedSlots: string[]
  timeSlots: TimeSlot[]
  setSelectedDate: (date: string) => void
  setSelectedStation: (station: Station | null) => void
  toggleSlotSelection: (slotId: string) => void
  clearSlotSelection: () => void
  loadTimeSlots: (stationId: string, date: string) => void
  createBooking: (photographerId: string, photographerName: string, memberLevel?: MemberLevel, filmType?: string, notes?: string) => Booking | null
  cancelBooking: (bookingId: string) => boolean
  mergeAdjacentBookings: (photographerId: string, stationId: string, date: string) => boolean
  splitMergedBooking: (bookingId: string, splitTime: string) => boolean
  getBookingsForStation: (stationId: string, date: string) => Booking[]
  getBookingsForDate: (date: string) => Booking[]
}

export const useScheduleStore = create<ScheduleState>((set, get) => ({
  stations: mockStations,
  bookings: mockBookings,
  selectedDate: dayjs().format('YYYY-MM-DD'),
  selectedStation: null,
  selectedSlots: [],
  timeSlots: [],

  setSelectedDate: (date) => {
    set({ selectedDate: date })
    const { selectedStation } = get()
    if (selectedStation) {
      get().loadTimeSlots(selectedStation.id, date)
    }
  },

  setSelectedStation: (station) => {
    set({ selectedStation: station, selectedSlots: [] })
    if (station) {
      const { selectedDate } = get()
      get().loadTimeSlots(station.id, selectedDate)
    }
  },

  toggleSlotSelection: (slotId) => {
    set((state) => {
      const slot = state.timeSlots.find(s => s.id === slotId)
      if (!slot || slot.status !== 'available') return state

      const isSelected = state.selectedSlots.includes(slotId)
      return {
        selectedSlots: isSelected
          ? state.selectedSlots.filter(id => id !== slotId)
          : [...state.selectedSlots, slotId]
      }
    })
  },

  clearSlotSelection: () => {
    set({ selectedSlots: [] })
  },

  loadTimeSlots: (stationId, date) => {
    const baseSlots = generateTimeSlots(stationId, date)
    const bookings = get().getBookingsForStation(stationId, date)

    const slotsWithStatus = baseSlots.map(slot => {
      const booking = bookings.find(b => {
        const slotStart = parseInt(slot.startTime.split(':')[0], 10)
        const slotEnd = parseInt(slot.endTime.split(':')[0], 10)
        const bookingStart = parseInt(b.startTime.split(':')[0], 10)
        const bookingEnd = parseInt(b.endTime.split(':')[0], 10)
        return slotStart >= bookingStart && slotEnd <= bookingEnd
      })

      if (booking) {
        return {
          ...slot,
          status: booking.isMerged ? 'merged' : 'occupied' as const,
          bookingId: booking.id
        }
      }
      return slot
    })

    set({ timeSlots: slotsWithStatus })
  },

  createBooking: (photographerId, photographerName, memberLevel, filmType, notes) => {
    const { selectedSlots, selectedStation, selectedDate, timeSlots } = get()
    if (selectedSlots.length === 0 || !selectedStation) return null

    const selectedTimeSlots = timeSlots.filter(s => selectedSlots.includes(s.id))
    if (selectedTimeSlots.length === 0) return null

    selectedTimeSlots.sort((a, b) => a.startTime.localeCompare(b.startTime))

    const startTime = selectedTimeSlots[0].startTime
    const endTime = selectedTimeSlots[selectedTimeSlots.length - 1].endTime
    const duration = calculateDuration(startTime, endTime)

    const newBooking: Booking = {
      id: `BK-${Date.now()}`,
      stationId: selectedStation.id,
      photographerId,
      photographerName,
      photographerLevel: memberLevel,
      date: selectedDate,
      startTime,
      endTime,
      duration,
      isMerged: selectedTimeSlots.length > 1,
      mergedFrom: selectedTimeSlots.length > 1 ? selectedTimeSlots.map(s => s.id) : undefined,
      status: 'active',
      createdAt: dayjs().toISOString(),
      filmType,
      notes
    }

    console.log('[ScheduleStore] 创建预订:', newBooking.id, startTime, '-', endTime, '时长:', duration, 'h')

    set((state) => ({
      bookings: [...state.bookings, newBooking],
      selectedSlots: []
    }))

    get().loadTimeSlots(selectedStation.id, selectedDate)

    return newBooking
  },

  cancelBooking: (bookingId) => {
    const { bookings } = get()
    const booking = bookings.find(b => b.id === bookingId)
    if (!booking) return false

    console.log('[ScheduleStore] 取消预订:', bookingId)

    set((state) => ({
      bookings: state.bookings.map(b =>
        b.id === bookingId ? { ...b, status: 'cancelled' as const } : b
      )
    }))

    const { selectedStation, selectedDate } = get()
    if (selectedStation) {
      get().loadTimeSlots(selectedStation.id, selectedDate)
    }

    return true
  },

  mergeAdjacentBookings: (photographerId, stationId, date) => {
    const { bookings } = get()
    const result = mergeBookings(bookings, photographerId, stationId, date)

    if (!result.success || !result.mergedBooking) {
      console.warn('[ScheduleStore] 合并失败:', result.message)
      return false
    }

    console.log('[ScheduleStore] 合并成功:', result.message)

    set((state) => {
      const remainingBookings = state.bookings.filter(
        b => !result.mergedSlots?.includes(b.id)
      )
      return {
        bookings: [...remainingBookings, result.mergedBooking!]
      }
    })

    return true
  },

  splitMergedBooking: (bookingId, splitTime) => {
    const { bookings } = get()
    const booking = bookings.find(b => b.id === bookingId)
    if (!booking) return false

    const result = splitBooking(booking, splitTime)

    if (!result.success || !result.newBookings) {
      console.warn('[ScheduleStore] 拆分失败:', result.message)
      return false
    }

    console.log('[ScheduleStore] 拆分成功:', result.message)

    set((state) => {
      const remainingBookings = state.bookings.filter(b => b.id !== bookingId)
      return {
        bookings: [...remainingBookings, ...result.newBookings!]
      }
    })

    const { selectedStation, selectedDate } = get()
    if (selectedStation) {
      get().loadTimeSlots(selectedStation.id, selectedDate)
    }

    return true
  },

  getBookingsForStation: (stationId, date) => {
    return get().bookings.filter(b =>
      b.stationId === stationId && b.date === date && b.status === 'active'
    ).sort((a, b) => a.startTime.localeCompare(b.startTime))
  },

  getBookingsForDate: (date) => {
    return get().bookings.filter(b =>
      b.date === date && b.status === 'active'
    ).sort((a, b) => a.startTime.localeCompare(b.startTime))
  }
}))
