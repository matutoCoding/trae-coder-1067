import dayjs from 'dayjs'
import type { Booking, TimeSlot, BookingMergeResult, BookingSplitResult } from '@/types'

export const generateTimeSlots = (
  stationId: string,
  date: string,
  startHour: number = 9,
  endHour: number = 22
): TimeSlot[] => {
  const slots: TimeSlot[] = []
  for (let hour = startHour; hour < endHour; hour++) {
    slots.push({
      id: `${stationId}-${date}-${hour}`,
      stationId,
      date,
      startTime: `${hour.toString().padStart(2, '0')}:00`,
      endTime: `${(hour + 1).toString().padStart(2, '0')}:00`,
      status: 'available'
    })
  }
  return slots
}

export const calculateDuration = (startTime: string, endTime: string): number => {
  const [startH, startM = 0] = startTime.split(':').map(Number)
  const [endH, endM] = endTime.split(':').map(Number)
  return (endH - startH) + (endM - startM) / 60
}

export const isAdjacent = (slot1: TimeSlot, slot2: TimeSlot): boolean => {
  return slot1.endTime === slot2.startTime || slot1.startTime === slot2.endTime
}

export const canMergeBookings = (
  booking1: Booking,
  booking2: Booking
): boolean => {
  if (booking1.stationId !== booking2.stationId) return false
  if (booking1.photographerId !== booking2.photographerId) return false
  if (booking1.date !== booking2.date) return false
  if (booking1.status !== 'active' || booking2.status !== 'active') return false
  return booking1.endTime === booking2.startTime || booking2.endTime === booking1.startTime
}

export const mergeBookings = (
  bookings: Booking[],
  photographerId: string,
  stationId: string,
  date: string
): BookingMergeResult => {
  const targetBookings = bookings.filter(
    b => b.stationId === stationId &&
    b.photographerId === photographerId &&
    b.date === date &&
    b.status === 'active'
  ).sort((a, b) => a.startTime.localeCompare(b.startTime))

  if (targetBookings.length < 2) {
    return { success: false, message: '没有可合并的时段' }
  }

  const toMerge: Booking[] = []
  let current: Booking | null = targetBookings[0]

  for (let i = 1; i < targetBookings.length; i++) {
    if (current && canMergeBookings(current, targetBookings[i])) {
      if (!toMerge.includes(current)) toMerge.push(current)
      toMerge.push(targetBookings[i])
      current = {
        ...current,
        endTime: targetBookings[i].endTime
      }
    } else {
      if (toMerge.length >= 2) break
      current = targetBookings[i]
    }
  }

  if (toMerge.length < 2) {
    return { success: false, message: '没有相邻的时段可合并' }
  }

  const startTime = toMerge[0].startTime
  const endTime = toMerge[toMerge.length - 1].endTime
  const duration = calculateDuration(startTime, endTime)

  const mergedBooking: Booking = {
    id: `BK-${Date.now()}`,
    stationId,
    photographerId,
    photographerName: toMerge[0].photographerName,
    date,
    startTime,
    endTime,
    duration,
    isMerged: true,
    mergedFrom: toMerge.map(b => b.id),
    status: 'active',
    createdAt: dayjs().toISOString()
  }

  console.log(`[BookingMerge] 合并成功: ${toMerge.length} 个时段 → ${startTime}-${endTime}`)

  return {
    success: true,
    mergedBooking,
    mergedSlots: toMerge.map(b => b.id),
    message: `成功合并 ${toMerge.length} 个连续时段`
  }
}

export const splitBooking = (
  booking: Booking,
  splitTime: string
): BookingSplitResult => {
  if (!booking.isMerged) {
    return { success: false, message: '该预订不是合并时段，无需拆分' }
  }

  const splitHour = parseInt(splitTime.split(':')[0], 10)
  const startHour = parseInt(booking.startTime.split(':')[0], 10)
  const endHour = parseInt(booking.endTime.split(':')[0], 10)

  if (splitHour <= startHour || splitHour >= endHour) {
    return { success: false, message: '拆分时间必须在时段范围内' }
  }

  const booking1: Booking = {
    ...booking,
    id: `BK-${Date.now()}-1`,
    startTime: booking.startTime,
    endTime: splitTime,
    duration: splitHour - startHour,
    isMerged: false,
    mergedFrom: undefined,
    mergedTo: undefined,
    createdAt: dayjs().toISOString()
  }

  const booking2: Booking = {
    ...booking,
    id: `BK-${Date.now()}-2`,
    startTime: splitTime,
    endTime: booking.endTime,
    duration: endHour - splitHour,
    isMerged: false,
    mergedFrom: undefined,
    mergedTo: undefined,
    createdAt: dayjs().toISOString()
  }

  console.log(`[BookingSplit] 拆分成功: ${booking.startTime}-${booking.endTime} → ${booking1.startTime}-${booking1.endTime} 和 ${booking2.startTime}-${booking2.endTime}`)

  return {
    success: true,
    newBookings: [booking1, booking2],
    message: '拆分成功'
  }
}

export const findMergeCancellation = (
  booking: Booking,
  allBookings: Booking[]
): BookingSplitResult | null => {
  if (!booking.isMerged || !booking.mergedFrom) return null

  const mergedIds = booking.mergedFrom || []
  const adjacentBookings = allBookings.filter(b => mergedIds.includes(b.id))

  if (adjacentBookings.length < 2) return null

  return {
    success: true,
    newBookings: adjacentBookings.map(b => ({
      ...b,
      id: `BK-${Date.now()}-${b.id}`,
      isMerged: false,
      mergedFrom: undefined,
      createdAt: dayjs().toISOString()
    })),
    message: '退订成功，已自动拆分时段已恢复'
  }
}

export const getBookingStatusText = (status: Booking['status']): string => {
  const map: Record<Booking['status'], string> = {
    active: '进行中',
    cancelled: '已取消',
    completed: '已完成'
  }
  return map[status]
}

export const getSlotStatusColor = (status: TimeSlot['status']): string => {
  const map: Record<TimeSlot['status'], string> = {
    available: '#00C853',
    occupied: '#FF5252',
    merged: '#FFAB00',
    locked: '#7A7A9D'
  }
  return map[status]
}

export const getSlotStatusText = (status: TimeSlot['status']): string => {
  const map: Record<TimeSlot['status'], string> = {
    available: '空闲',
    occupied: '占用',
    merged: '合并',
    locked: '锁定'
  }
  return map[status]
}
