import type { PricingTier, PricingCalculationResult, TierBreakdownItem, MemberLevel, FilmFormat } from '@/types'
import { MEMBER_LEVELS } from '@/types'

export const calculatePricing = (
  totalHours: number,
  tiers: PricingTier[],
  memberLevel: MemberLevel = 'normal',
  stationHourlyRate: number = 80,
  extraDiscountRate: number = 0
): PricingCalculationResult => {
  const activeTiers = [...tiers]
    .filter(t => t.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder)

  const baseRate = 80
  const rateMultiplier = stationHourlyRate / baseRate
  const memberDiscountRate = MEMBER_LEVELS[memberLevel]?.discountRate || 0

  if (activeTiers.length === 0) {
    return {
      totalHours,
      tierBreakdown: [],
      originalTotal: 0,
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
      memberDiscountAmount: 0,
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
    const adjustedRate = Math.round(tier.rate * rateMultiplier)

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
      const amount = hoursInThisTier * adjustedRate
      tierBreakdown.push({
        tierId: tier.id,
        tierName: tier.name,
        hours: hoursInThisTier,
        rate: adjustedRate,
        amount: Math.round(amount * 100) / 100
      })
      subtotal += amount
      remainingHours -= hoursInThisTier
    }
  }

  const currentTier = activeTiers[currentTierIndex] || activeTiers[0]
  const nextTier = activeTiers[currentTierIndex + 1]
  const hoursToNextTier = nextTier ? nextTier.startHour - totalHours : 0
  const nearTierThreshold = nextTier ? hoursToNextTier <= 0.5 : false

  const stationFee = Math.round(subtotal * 100) / 100
  const originalTotal = stationFee
  const memberDiscountAmount = Math.round(stationFee * memberDiscountRate * 100) / 100
  const afterMemberDiscount = stationFee - memberDiscountAmount
  const discountAmount = Math.round(afterMemberDiscount * extraDiscountRate * 100) / 100
  const total = Math.round((afterMemberDiscount - discountAmount) * 100) / 100

  console.log('[PricingCalc] 计价完成:', {
    totalHours,
    stationHourlyRate,
    rateMultiplier,
    memberLevel,
    memberDiscountRate,
    extraDiscountRate,
    tiers: tierBreakdown.map(t => `${t.tierName}: ${t.hours}h × ¥${t.rate}`),
    stationFee: `¥${stationFee}`,
    originalTotal: `¥${originalTotal}`,
    memberDiscountAmount: `¥${memberDiscountAmount}`,
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
    originalTotal,
    total,
    currentTier,
    nextTier,
    hoursToNextTier: Math.max(0, hoursToNextTier),
    nearTierThreshold,
    stationFee,
    memberDiscountAmount,
    discountAmount,
    discountRate: extraDiscountRate
  }
}

export const calculateFilmPrice = (
  filmType: string,
  processType: string,
  quantity: number,
  format: FilmFormat | string
): number => {
  const baseFilmPrices: Record<string, number> = {
    '柯达Tri-X 400': 35,
    '柯达T-Max 100': 40,
    '柯达T-Max 400': 38,
    '伊尔福HP5+': 32,
    '伊尔福Delta 100': 36,
    '伊尔福Delta 400': 35,
    '富士C200': 25,
    '富士Provia 100F': 45,
    '柯达ColorPlus 200': 28,
    '柯达Gold 200': 30,
    '柯达Ektar 100': 50,
    '柯达Portra 160': 55,
    '柯达Portra 400': 58,
    '柯达Portra 800': 65,
    '富士Superia X-TRA 400': 32
  }

  const baseProcessPrices: Record<string, number> = {
    'C-41': 25,
    'E-6': 40,
    '黑白': 30,
    '黑白反转': 50,
    '扫描': 20
  }

  const formatMultipliers: Record<string, number> = {
    '135': 1,
    '120': 1.5,
    '4x5': 2,
    '8x10': 3
  }

  const filmPrice = baseFilmPrices[filmType] || 30
  const processPrice = baseProcessPrices[processType] || 25
  const formatMultiplier = formatMultipliers[format] || 1

  const total = (filmPrice + processPrice) * quantity * formatMultiplier
  const finalPrice = Math.round(total * 100) / 100

  console.log('[FilmCalc] 计价:', {
    filmType, processType, format, quantity,
    filmPrice, processPrice, formatMultiplier,
    total: finalPrice
  })

  return finalPrice
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
