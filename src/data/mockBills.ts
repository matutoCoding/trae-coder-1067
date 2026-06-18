import type { Bill, BillOperationLog } from '@/types'
import dayjs from 'dayjs'

const createOperationLog = (
  billId: string,
  operation: BillOperationLog['operation'],
  amount: number,
  changeAmount: number,
  previousStatus: Bill['status'],
  newStatus: Bill['status'],
  notes?: string
): BillOperationLog => ({
  id: `LOG-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  billId,
  operation,
  operator: '系统',
  amount,
  changeAmount,
  previousStatus,
  newStatus,
  notes,
  createdAt: dayjs().toISOString()
})

export const mockBills: Bill[] = [
  {
    id: 'BL-001',
    billNo: '20240618-001',
    bookingId: 'BK-009',
    photographerId: 'PH-001',
    photographerName: '张明',
    photographerLevel: 'gold',
    stationId: 'ST-003',
    stationName: '彩色暗房C',
    date: dayjs().subtract(1, 'day').format('YYYY-MM-DD'),
    totalHours: 2,
    tierBreakdown: [
      { tierId: 'tier-1', tierName: '基础档', hours: 2, rate: 120, amount: 240 }
    ],
    originalTotal: 240,
    stationFee: 240,
    filmFee: 80,
    memberDiscountAmount: 24,
    discountAmount: 0,
    discountRate: 0,
    refundAmount: 0,
    total: 296,
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
    operationLogs: [
      createOperationLog('BL-001', 'create', 296, 296, 'unpaid', 'unpaid', '账单创建'),
      createOperationLog('BL-001', 'pay', 296, 296, 'unpaid', 'paid', '前台收款')
    ],
    notes: '金卡会员，10%折扣',
    createdAt: dayjs().subtract(1, 'day').toISOString(),
    paidAt: dayjs().subtract(1, 'day').toISOString()
  },
  {
    id: 'BL-002',
    billNo: '20240618-002',
    bookingId: 'BK-001',
    photographerId: 'PH-001',
    photographerName: '张明',
    photographerLevel: 'gold',
    stationId: 'ST-001',
    stationName: '黑白暗房A',
    date: dayjs().format('YYYY-MM-DD'),
    totalHours: 3,
    tierBreakdown: [
      { tierId: 'tier-1', tierName: '基础档', hours: 2, rate: 80, amount: 160 },
      { tierId: 'tier-2', tierName: '进阶档', hours: 1, rate: 100, amount: 100 }
    ],
    originalTotal: 260,
    stationFee: 260,
    filmFee: 120,
    memberDiscountAmount: 26,
    discountAmount: 12,
    discountRate: 0.05,
    refundAmount: 0,
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
    operationLogs: [
      createOperationLog('BL-002', 'create', 342, 342, 'unpaid', 'unpaid', '账单创建')
    ],
    createdAt: dayjs().toISOString()
  },
  {
    id: 'BL-003',
    billNo: '20240618-003',
    bookingId: 'BK-002',
    photographerId: 'PH-002',
    photographerName: '李华',
    photographerLevel: 'silver',
    stationId: 'ST-001',
    stationName: '黑白暗房A',
    date: dayjs().format('YYYY-MM-DD'),
    totalHours: 2,
    tierBreakdown: [
      { tierId: 'tier-1', tierName: '基础档', hours: 2, rate: 80, amount: 160 }
    ],
    originalTotal: 160,
    stationFee: 160,
    filmFee: 180,
    memberDiscountAmount: 8,
    discountAmount: 0,
    discountRate: 0,
    refundAmount: 0,
    total: 332,
    status: 'unpaid',
    filmRecords: [
      {
        id: 'FR-003',
        filmType: '伊尔福HP5+',
        format: '120',
        processType: '黑白',
        quantity: 2,
        price: 180,
        notes: '放大至8x10英寸',
        createdAt: dayjs().toISOString()
      }
    ],
    operationLogs: [
      createOperationLog('BL-003', 'create', 332, 332, 'unpaid', 'unpaid', '账单创建')
    ],
    createdAt: dayjs().toISOString()
  },
  {
    id: 'BL-004',
    billNo: '20240618-004',
    bookingId: 'BK-003',
    photographerId: 'PH-003',
    photographerName: '王芳',
    photographerLevel: 'gold',
    stationId: 'ST-002',
    stationName: '黑白暗房B',
    date: dayjs().format('YYYY-MM-DD'),
    totalHours: 3,
    tierBreakdown: [
      { tierId: 'tier-1', tierName: '基础档', hours: 2, rate: 60, amount: 120 },
      { tierId: 'tier-2', tierName: '进阶档', hours: 1, rate: 75, amount: 75 }
    ],
    originalTotal: 195,
    stationFee: 195,
    filmFee: 0,
    memberDiscountAmount: 19.5,
    discountAmount: 0,
    discountRate: 0,
    refundAmount: 0,
    total: 175.5,
    status: 'unpaid',
    filmRecords: [],
    operationLogs: [
      createOperationLog('BL-004', 'create', 175.5, 175.5, 'unpaid', 'unpaid', '账单创建')
    ],
    createdAt: dayjs().toISOString()
  },
  {
    id: 'BL-005',
    billNo: '20240618-005',
    bookingId: 'BK-004',
    photographerId: 'PH-001',
    photographerName: '张明',
    photographerLevel: 'gold',
    stationId: 'ST-003',
    stationName: '彩色暗房C',
    date: dayjs().format('YYYY-MM-DD'),
    totalHours: 3,
    tierBreakdown: [
      { tierId: 'tier-1', tierName: '基础档', hours: 2, rate: 120, amount: 240 },
      { tierId: 'tier-2', tierName: '进阶档', hours: 1, rate: 150, amount: 150 }
    ],
    originalTotal: 390,
    stationFee: 390,
    filmFee: 200,
    memberDiscountAmount: 39,
    discountAmount: 0,
    discountRate: 0,
    refundAmount: 0,
    total: 551,
    status: 'unpaid',
    filmRecords: [
      {
        id: 'FR-004',
        filmType: '富士C200',
        format: '120',
        processType: 'C-41',
        quantity: 5,
        price: 200,
        notes: '客户要求4K扫描',
        createdAt: dayjs().toISOString()
      }
    ],
    operationLogs: [
      createOperationLog('BL-005', 'create', 551, 551, 'unpaid', 'unpaid', '账单创建')
    ],
    createdAt: dayjs().toISOString()
  },
  {
    id: 'BL-006',
    billNo: '20240616-001',
    bookingId: 'BK-010',
    photographerId: 'PH-004',
    photographerName: '赵强',
    photographerLevel: 'normal',
    stationId: 'ST-002',
    stationName: '黑白暗房B',
    date: dayjs().subtract(2, 'day').format('YYYY-MM-DD'),
    totalHours: 2,
    tierBreakdown: [
      { tierId: 'tier-1', tierName: '基础档', hours: 2, rate: 60, amount: 120 }
    ],
    originalTotal: 120,
    stationFee: 120,
    filmFee: 0,
    memberDiscountAmount: 0,
    discountAmount: 0,
    discountRate: 0,
    refundAmount: 60,
    total: 60,
    status: 'refunded',
    filmRecords: [],
    operationLogs: [
      createOperationLog('BL-006', 'create', 120, 120, 'unpaid', 'unpaid', '账单创建'),
      createOperationLog('BL-006', 'pay', 120, 120, 'unpaid', 'paid', '客户扫码支付'),
      createOperationLog('BL-006', 'partial_refund', 60, -60, 'paid', 'refunded', '客户提前离开，部分退款')
    ],
    createdAt: dayjs().subtract(2, 'day').toISOString()
  },
  {
    id: 'BL-007',
    billNo: '20240615-001',
    photographerId: 'PH-005',
    photographerName: '陈静',
    photographerLevel: 'silver',
    date: dayjs().subtract(3, 'day').format('YYYY-MM-DD'),
    totalHours: 4,
    tierBreakdown: [
      { tierId: 'tier-1', tierName: '基础档', hours: 2, rate: 80, amount: 160 },
      { tierId: 'tier-2', tierName: '进阶档', hours: 2, rate: 100, amount: 200 }
    ],
    originalTotal: 360,
    stationFee: 360,
    filmFee: 160,
    memberDiscountAmount: 18,
    discountAmount: 0,
    discountRate: 0,
    refundAmount: 0,
    total: 502,
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
    operationLogs: [
      createOperationLog('BL-007', 'create', 502, 502, 'unpaid', 'unpaid', '账单创建'),
      createOperationLog('BL-007', 'pay', 502, 502, 'unpaid', 'paid', '银卡会员，5%折扣')
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
    refunded: '已退款',
    cancelled: '已取消'
  }
  return map[status]
}

export const getBillStatusColor = (status: Bill['status']): string => {
  const map: Record<Bill['status'], string> = {
    unpaid: '#FFAB00',
    paid: '#00C853',
    refunded: '#7A7A9D',
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

export const getOperationLabel = (operation: BillOperationLog['operation']): string => {
  const map: Record<BillOperationLog['operation'], string> = {
    create: '创建账单',
    pay: '收款',
    partial_refund: '部分退款',
    full_refund: '全额退款',
    cancel: '取消',
    update: '修改'
  }
  return map[operation]
}
