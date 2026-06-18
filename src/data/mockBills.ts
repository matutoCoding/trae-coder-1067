import type { Bill } from '@/types'
import dayjs from 'dayjs'

export const mockBills: Bill[] = [
  {
    id: 'BL-001',
    billNo: '20240618-001',
    bookingId: 'BK-009',
    photographerId: 'PH-001',
    photographerName: '张明',
    stationId: 'ST-003',
    stationName: '彩色暗房C',
    date: dayjs().subtract(1, 'day').format('YYYY-MM-DD'),
    totalHours: 2,
    tierBreakdown: [
      {
        tierId: 'tier-1',
        tierName: '基础档',
        hours: 2,
        rate: 80,
        amount: 160
      }
    ],
    stationFee: 160,
    filmFee: 80,
    discountAmount: 0,
    discountRate: 0,
    total: 240,
    status: 'paid',
    filmRecords: [
      {
        id: 'FR-001',
        filmType: '柯达ColorPlus 200',
        format: '135',
        processType: 'C-41',
        quantity: 2,
        price: 80,
        notes: '彩色负片冲洗扫描',
        createdAt: dayjs().subtract(1, 'day').toISOString()
      }
    ],
    notes: '老客户，服务周到',
    createdAt: dayjs().subtract(1, 'day').toISOString(),
    paidAt: dayjs().subtract(1, 'day').toISOString()
  },
  {
    id: 'BL-002',
    billNo: '20240618-002',
    bookingId: 'BK-001',
    photographerId: 'PH-001',
    photographerName: '张明',
    stationId: 'ST-001',
    stationName: '黑白暗房A',
    date: dayjs().format('YYYY-MM-DD'),
    totalHours: 3,
    tierBreakdown: [
      {
        tierId: 'tier-1',
        tierName: '基础档',
        hours: 2,
        rate: 80,
        amount: 160
      },
      {
        tierId: 'tier-2',
        tierName: '进阶档',
        hours: 1,
        rate: 100,
        amount: 100
      }
    ],
    stationFee: 260,
    filmFee: 120,
    discountAmount: 38,
    discountRate: 0.1,
    total: 342,
    status: 'unpaid',
    filmRecords: [
      {
        id: 'FR-002',
        filmType: '柯达Tri-X 400',
        format: '120',
        processType: '黑白',
        quantity: 3,
        price: 120,
        createdAt: dayjs().toISOString()
      }
    ],
    createdAt: dayjs().toISOString()
  },
  {
    id: 'BL-003',
    billNo: '20240618-003',
    bookingId: 'BK-002',
    photographerId: 'PH-002',
    photographerName: '李华',
    stationId: 'ST-001',
    stationName: '黑白暗房A',
    date: dayjs().format('YYYY-MM-DD'),
    totalHours: 2,
    tierBreakdown: [
      {
        tierId: 'tier-1',
        tierName: '基础档',
        hours: 2,
        rate: 80,
        amount: 160
      }
    ],
    stationFee: 160,
    filmFee: 180,
    discountAmount: 0,
    discountRate: 0,
    total: 340,
    status: 'unpaid',
    filmRecords: [
      {
        id: 'FR-003',
        filmType: '伊尔福HP5+',
        format: '135',
        processType: '黑白',
        quantity: 2,
        price: 180,
        notes: '放大至8x10英寸',
        createdAt: dayjs().toISOString()
      }
    ],
    createdAt: dayjs().toISOString()
  },
  {
    id: 'BL-004',
    billNo: '20240618-004',
    bookingId: 'BK-003',
    photographerId: 'PH-003',
    photographerName: '王芳',
    stationId: 'ST-002',
    stationName: '黑白暗房B',
    date: dayjs().format('YYYY-MM-DD'),
    totalHours: 3,
    tierBreakdown: [
      {
        tierId: 'tier-1',
        tierName: '基础档',
        hours: 2,
        rate: 80,
        amount: 160
      },
      {
        tierId: 'tier-2',
        tierName: '进阶档',
        hours: 1,
        rate: 100,
        amount: 100
      }
    ],
    stationFee: 260,
    filmFee: 0,
    discountAmount: 26,
    discountRate: 0.1,
    total: 234,
    status: 'unpaid',
    filmRecords: [],
    createdAt: dayjs().toISOString()
  },
  {
    id: 'BL-005',
    billNo: '20240618-005',
    bookingId: 'BK-004',
    photographerId: 'PH-001',
    photographerName: '张明',
    stationId: 'ST-003',
    stationName: '彩色暗房C',
    date: dayjs().format('YYYY-MM-DD'),
    totalHours: 3,
    tierBreakdown: [
      {
        tierId: 'tier-1',
        tierName: '基础档',
        hours: 2,
        rate: 80,
        amount: 160
      },
      {
        tierId: 'tier-2',
        tierName: '进阶档',
        hours: 1,
        rate: 100,
        amount: 100
      }
    ],
    stationFee: 260,
    filmFee: 200,
    discountAmount: 46,
    discountRate: 0.1,
    total: 414,
    status: 'unpaid',
    filmRecords: [
      {
        id: 'FR-004',
        filmType: '富士C200',
        format: '135',
        processType: 'C-41',
        quantity: 5,
        price: 200,
        notes: '客户要求4K扫描',
        createdAt: dayjs().toISOString()
      }
    ],
    createdAt: dayjs().toISOString()
  },
  {
    id: 'BL-006',
    billNo: '20240616-001',
    bookingId: 'BK-010',
    photographerId: 'PH-004',
    photographerName: '赵强',
    stationId: 'ST-002',
    stationName: '黑白暗房B',
    date: dayjs().subtract(2, 'day').format('YYYY-MM-DD'),
    totalHours: 2,
    tierBreakdown: [
      {
        tierId: 'tier-1',
        tierName: '基础档',
        hours: 2,
        rate: 80,
        amount: 160
      }
    ],
    stationFee: 160,
    filmFee: 0,
    discountAmount: 0,
    discountRate: 0,
    total: 160,
    status: 'cancelled',
    filmRecords: [],
    createdAt: dayjs().subtract(2, 'day').toISOString()
  },
  {
    id: 'BL-007',
    billNo: '20240615-001',
    photographerId: 'PH-005',
    photographerName: '陈静',
    date: dayjs().subtract(3, 'day').format('YYYY-MM-DD'),
    totalHours: 4,
    tierBreakdown: [
      {
        tierId: 'tier-1',
        tierName: '基础档',
        hours: 2,
        rate: 80,
        amount: 160
      },
      {
        tierId: 'tier-2',
        tierName: '进阶档',
        hours: 2,
        rate: 100,
        amount: 200
      }
    ],
    stationFee: 360,
    filmFee: 160,
    discountAmount: 52,
    discountRate: 0.1,
    total: 468,
    status: 'paid',
    filmRecords: [
      {
        id: 'FR-005',
        filmType: '柯达Portra 400',
        format: '120',
        processType: 'C-41',
        quantity: 4,
        price: 160,
        createdAt: dayjs().subtract(3, 'day').toISOString()
      }
    ],
    createdAt: dayjs().subtract(3, 'day').toISOString(),
    paidAt: dayjs().subtract(3, 'day').toISOString()
  }
]

export const getBillsByPhotographer = (photographerId: string): Bill[] => {
  return mockBills.filter(b => b.photographerId === photographerId)
}

export const getBillsByStatus = (status: Bill['status']): Bill[] => {
  return mockBills.filter(b => b.status === status)
}

export const getBillStatusLabel = (status: Bill['status']): string => {
  const map: Record<Bill['status'], string> = {
    unpaid: '待支付',
    paid: '已支付',
    cancelled: '已取消'
  }
  return map[status]
}

export const getBillStatusColor = (status: Bill['status']): string => {
  const map: Record<Bill['status'], string> = {
    unpaid: '#FFAB00',
    paid: '#00C853',
    cancelled: '#7A7A9D'
  }
  return map[status]
}

export const calculateTotalRevenue = (bills: Bill[]): number => {
  return bills
    .filter(b => b.status === 'paid')
    .reduce((sum, b) => sum + b.total, 0)
}

export const calculateUnpaidAmount = (bills: Bill[]): number => {
  return bills
    .filter(b => b.status === 'unpaid')
    .reduce((sum, b) => sum + b.total, 0)
}
