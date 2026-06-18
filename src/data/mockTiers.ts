import type { PricingTier } from '@/types'

export const mockTiers: PricingTier[] = [
  {
    id: 'tier-1',
    name: '基础档',
    startHour: 0,
    endHour: 2,
    rate: 80,
    description: '0-2小时，标准收费',
    color: '#00C853',
    sortOrder: 1,
    isActive: true
  },
  {
    id: 'tier-2',
    name: '进阶档',
    startHour: 2,
    endHour: 4,
    rate: 100,
    description: '2-4小时，每小时+20元',
    color: '#448AFF',
    sortOrder: 2,
    isActive: true
  },
  {
    id: 'tier-3',
    name: '高峰档',
    startHour: 4,
    endHour: 6,
    rate: 130,
    description: '4-6小时，每小时+30元',
    color: '#FFAB00',
    sortOrder: 3,
    isActive: true
  },
  {
    id: 'tier-4',
    name: '超时档',
    startHour: 6,
    endHour: 999,
    rate: 180,
    description: '6小时以上，每小时+50元',
    color: '#FF5252',
    sortOrder: 4,
    isActive: true
  }
]
