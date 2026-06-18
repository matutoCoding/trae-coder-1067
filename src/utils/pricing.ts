import type { PricingTier, PricingCalculationResult, TierBreakdownItem } from '@/types'

export const calculatePricing = (
  totalHours: number,
  tiers: PricingTier[],
  discountRate: number = 0
): PricingCalculationResult => {
  const activeTiers = [...tiers]
    .filter(t => t.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder)

  if (activeTiers.length === 0) {
    return {
      totalHours,
      tierBreakdown: [],
      total: 0,
      currentTier: {
        id: 'default',
        name: '标准档',
        startHour: 0,
        endHour: 999,
        rate: 0,
        description: '默认档位',
        color: '#8B4513',
        sortOrder: 0,
        isActive: true
      },
      hoursToNextTier: 0,
      nearTierThreshold: false,
      stationFee: 0,
      discountAmount: 0,
      discountRate: 0
    }
  }

  const tierBreakdown: TierBreakdownItem[] = []
  let remainingHours = totalHours
  let subtotal = 0
  let currentTierIndex = 0

  for (let i = 0; i < activeTiers.length; i++) {
    const tier = activeTiers[i]
    const tierHours = tier.endHour - tier.startHour

    if (remainingHours <= 0) break

    let hoursInThisTier: number
    if (totalHours > tier.endHour) {
      hoursInThisTier = tierHours
    } else if (totalHours > tier.startHour) {
      hoursInThisTier = totalHours - tier.startHour
      currentTierIndex = i
    } else {
      break
    }

    hoursInThisTier = Math.min(hoursInThisTier, remainingHours)

    if (hoursInThisTier > 0) {
      const amount = hoursInThisTier * tier.rate
      tierBreakdown.push({
        tierId: tier.id,
        tierName: tier.name,
        hours: hoursInThisTier,
        rate: tier.rate,
        amount
      })
      subtotal += amount
      remainingHours -= hoursInThisTier
    }
  }

  const currentTier = activeTiers[currentTierIndex] || activeTiers[0]
  const nextTier = activeTiers[currentTierIndex + 1]
  const hoursToNextTier = nextTier ? nextTier.startHour - totalHours : 0
  const nearTierThreshold = nextTier ? hoursToNextTier <= 0.5 : false

  const discountAmount = subtotal * discountRate
  const total = subtotal - discountAmount

  console.log('[PricingCalc] 计价完成:', {
    totalHours,
    tiers: tierBreakdown.map(t => `${t.tierName}: ${t.hours}h × ¥${t.rate}`),
    subtotal: `¥${subtotal}`,
    discountAmount: `¥${discountAmount}`,
    total: `¥${total}`,
    currentTier: currentTier.name,
    nextTier: nextTier?.name,
    hoursToNextTier,
    nearTierThreshold
  })

  return {
    totalHours,
    tierBreakdown,
    total: Math.round(total * 100) / 100,
    currentTier,
    nextTier,
    hoursToNextTier: Math.max(0, hoursToNextTier),
    nearTierThreshold,
    stationFee: Math.round(subtotal * 100) / 100,
    discountAmount: Math.round(discountAmount * 100) / 100,
    discountRate
  }
}

export const getCurrentTierForHours = (
  hours: number,
  tiers: PricingTier[]
): PricingTier | undefined => {
  const activeTiers = [...tiers]
    .filter(t => t.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder)

  for (let i = activeTiers.length - 1; i >= 0; i--) {
    if (hours > activeTiers[i].startHour) {
      return activeTiers[i]
    }
  }

  return activeTiers[0]
}

export const formatCurrency = (amount: number): string => {
  return `¥${amount.toFixed(2)}`
}

export const formatDuration = (hours: number): string => {
  const h = Math.floor(hours)
  const m = Math.round((hours - h) * 60)
  if (m === 0) return `${h}小时`
  return `${h}小时${m}分钟`
}

export const generateDefaultTiers = (): PricingTier[] => {
  return [
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
}

export const getTierWarningMessage = (result: PricingCalculationResult): string | null => {
  if (!result.nearTierThreshold || !result.nextTier) return null

  return `再使用 ${result.hoursToNextTier.toFixed(1)} 小时将进入「${result.nextTier.name}」，单价从 ¥${result.currentTier.rate}/h 上涨至 ¥${result.nextTier.rate}/h`
}

export const validateTierOverlap = (
  tiers: PricingTier[]
): { isValid: boolean; message?: string } => {
  const activeTiers = [...tiers]
    .filter(t => t.isActive)
    .sort((a, b) => a.startHour - b.startHour)

  for (let i = 0; i < activeTiers.length - 1; i++) {
    const current = activeTiers[i]
    const next = activeTiers[i + 1]

    if (current.endHour > next.startHour) {
      return {
        isValid: false,
        message: `档位「${current.name}」与「${next.name}」存在时间重叠`
      }
    }

    if (current.endHour < next.startHour) {
      return {
        isValid: false,
        message: `档位「${current.name}」与「${next.name}」之间存在时间间隙`
      }
    }
  }

  return { isValid: true }
}
