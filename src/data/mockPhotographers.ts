import type { Photographer, MemberLevel } from '@/types'
import { MEMBER_LEVELS } from '@/types'
import dayjs from 'dayjs'

export const mockPhotographers: Photographer[] = [
  {
    id: 'PH-001',
    name: '张明',
    phone: '138****1234',
    email: 'zhangming@example.com',
    memberLevel: 'gold',
    totalBookings: 28,
    createdAt: dayjs().subtract(8, 'month').toISOString()
  },
  {
    id: 'PH-002',
    name: '李华',
    phone: '139****5678',
    email: 'lihua@example.com',
    memberLevel: 'silver',
    totalBookings: 15,
    createdAt: dayjs().subtract(5, 'month').toISOString()
  },
  {
    id: 'PH-003',
    name: '王芳',
    phone: '137****9012',
    email: 'wangfang@example.com',
    memberLevel: 'gold',
    totalBookings: 42,
    createdAt: dayjs().subtract(12, 'month').toISOString()
  },
  {
    id: 'PH-004',
    name: '赵强',
    phone: '136****3456',
    email: 'zhaoqiang@example.com',
    memberLevel: 'normal',
    totalBookings: 7,
    createdAt: dayjs().subtract(2, 'month').toISOString()
  },
  {
    id: 'PH-005',
    name: '陈静',
    phone: '135****7890',
    email: 'chenjing@example.com',
    memberLevel: 'silver',
    totalBookings: 22,
    createdAt: dayjs().subtract(6, 'month').toISOString()
  },
  {
    id: 'PH-006',
    name: '刘伟',
    phone: '134****2345',
    memberLevel: 'normal',
    totalBookings: 3,
    createdAt: dayjs().subtract(1, 'month').toISOString()
  }
]

export const getMemberLevelLabel = (level: MemberLevel): string => {
  return MEMBER_LEVELS[level]?.label || '普通会员'
}

export const getMemberLevelColor = (level: MemberLevel): string => {
  return MEMBER_LEVELS[level]?.color || '#7A7A9D'
}

export const getMemberDiscountRate = (level: MemberLevel): number => {
  return MEMBER_LEVELS[level]?.discountRate || 0
}

export const getPhotographerById = (id: string): Photographer | undefined => {
  return mockPhotographers.find(p => p.id === id)
}

export const getPhotographerByName = (name: string): Photographer | undefined => {
  return mockPhotographers.find(p => p.name === name)
}
