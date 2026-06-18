import type { Booking } from '@/types'
import dayjs from 'dayjs'

const today = dayjs().format('YYYY-MM-DD')
const tomorrow = dayjs().add(1, 'day').format('YYYY-MM-DD')
const dayAfter = dayjs().add(2, 'day').format('YYYY-MM-DD')

export const mockBookings: Booking[] = [
  {
    id: 'BK-001',
    stationId: 'ST-001',
    photographerId: 'PH-001',
    photographerName: '张明',
    date: today,
    startTime: '09:00',
    endTime: '12:00',
    duration: 3,
    isMerged: true,
    mergedFrom: ['BK-001-A', 'BK-001-B', 'BK-001-C'],
    status: 'active',
    createdAt: dayjs().subtract(3, 'day').toISOString(),
    filmType: '柯达Tri-X 400',
    notes: '需要使用放大机'
  },
  {
    id: 'BK-002',
    stationId: 'ST-001',
    photographerId: 'PH-002',
    photographerName: '李华',
    date: today,
    startTime: '14:00',
    endTime: '16:00',
    duration: 2,
    isMerged: false,
    status: 'active',
    createdAt: dayjs().subtract(2, 'day').toISOString(),
    filmType: '伊尔福HP5+'
  },
  {
    id: 'BK-003',
    stationId: 'ST-002',
    photographerId: 'PH-003',
    photographerName: '王芳',
    date: today,
    startTime: '10:00',
    endTime: '13:00',
    duration: 3,
    isMerged: true,
    mergedFrom: ['BK-003-A', 'BK-003-B', 'BK-003-C'],
    status: 'active',
    createdAt: dayjs().subtract(1, 'day').toISOString()
  },
  {
    id: 'BK-004',
    stationId: 'ST-003',
    photographerId: 'PH-001',
    photographerName: '张明',
    date: today,
    startTime: '15:00',
    endTime: '18:00',
    duration: 3,
    isMerged: false,
    status: 'active',
    createdAt: dayjs().subtract(1, 'day').toISOString(),
    filmType: '富士C200',
    notes: '彩色冲洗'
  },
  {
    id: 'BK-005',
    stationId: 'ST-001',
    photographerId: 'PH-004',
    photographerName: '赵强',
    date: tomorrow,
    startTime: '09:00',
    endTime: '11:00',
    duration: 2,
    isMerged: false,
    status: 'active',
    createdAt: dayjs().subtract(12, 'hour').toISOString()
  },
  {
    id: 'BK-006',
    stationId: 'ST-002',
    photographerId: 'PH-005',
    photographerName: '陈静',
    date: tomorrow,
    startTime: '13:00',
    endTime: '17:00',
    duration: 4,
    isMerged: true,
    mergedFrom: ['BK-006-A', 'BK-006-B', 'BK-006-C', 'BK-006-D'],
    status: 'active',
    createdAt: dayjs().subtract(6, 'hour').toISOString(),
    filmType: '柯达Portra 400'
  },
  {
    id: 'BK-007',
    stationId: 'ST-005',
    photographerId: 'PH-002',
    photographerName: '李华',
    date: tomorrow,
    startTime: '10:00',
    endTime: '14:00',
    duration: 4,
    isMerged: false,
    status: 'active',
    createdAt: dayjs().subtract(3, 'hour').toISOString()
  },
  {
    id: 'BK-008',
    stationId: 'ST-001',
    photographerId: 'PH-003',
    photographerName: '王芳',
    date: dayAfter,
    startTime: '09:00',
    endTime: '15:00',
    duration: 6,
    isMerged: true,
    mergedFrom: ['BK-008-A', 'BK-008-B', 'BK-008-C', 'BK-008-D', 'BK-008-E', 'BK-008-F'],
    status: 'active',
    createdAt: dayjs().subtract(1, 'hour').toISOString(),
    notes: '全天使用，包含午休'
  },
  {
    id: 'BK-009',
    stationId: 'ST-003',
    photographerId: 'PH-001',
    photographerName: '张明',
    date: dayjs().subtract(1, 'day').format('YYYY-MM-DD'),
    startTime: '10:00',
    endTime: '12:00',
    duration: 2,
    isMerged: false,
    status: 'completed',
    createdAt: dayjs().subtract(5, 'day').toISOString()
  },
  {
    id: 'BK-010',
    stationId: 'ST-002',
    photographerId: 'PH-004',
    photographerName: '赵强',
    date: dayjs().subtract(2, 'day').format('YYYY-MM-DD'),
    startTime: '14:00',
    endTime: '16:00',
    duration: 2,
    isMerged: false,
    status: 'cancelled',
    createdAt: dayjs().subtract(7, 'day').toISOString()
  }
]

export const getBookingsByStation = (stationId: string, date?: string): Booking[] => {
  return mockBookings.filter(b => {
    if (date) return b.stationId === stationId && b.date === date
    return b.stationId === stationId
  })
}

export const getBookingsByPhotographer = (photographerId: string): Booking[] => {
  return mockBookings.filter(b => b.photographerId === photographerId)
}

export const getActiveBookingsForDate = (date: string): Booking[] => {
  return mockBookings.filter(b => b.date === date && b.status === 'active')
}
