import { create } from 'zustand'
import type { PricingTier, PricingCalculationResult, MemberLevel } from '@/types'
import { mockTiers } from '@/data/mockTiers'
import { calculatePricing, validateTierOverlap, generateDefaultTiers } from '@/utils/pricing'

interface PricingState {
  tiers: PricingTier[]
  calculationResult: PricingCalculationResult | null
  selectedHours: number
  memberLevel: MemberLevel
  stationHourlyRate: number
  extraDiscountRate: number
  setSelectedHours: (hours: number) => void
  setMemberLevel: (level: MemberLevel) => void
  setStationHourlyRate: (rate: number) => void
  setExtraDiscountRate: (rate: number) => void
  calculate: (hours?: number, memberLevel?: MemberLevel, stationRate?: number, extraDiscount?: number) => PricingCalculationResult
  addTier: (tier: Omit<PricingTier, 'id'>) => boolean
  updateTier: (id: string, updates: Partial<PricingTier>) => boolean
  deleteTier: (id: string) => boolean
  reorderTiers: () => void
  resetTiers: () => void
  toggleTierActive: (id: string) => void
}

export const usePricingStore = create<PricingState>((set, get) => ({
  tiers: mockTiers,
  calculationResult: null,
  selectedHours: 1,
  memberLevel: 'normal',
  stationHourlyRate: 80,
  extraDiscountRate: 0,

  setSelectedHours: (hours) => {
    set({ selectedHours: hours })
    get().calculate(hours)
  },

  setMemberLevel: (level) => {
    set({ memberLevel: level })
    const { selectedHours, stationHourlyRate, extraDiscountRate } = get()
    get().calculate(selectedHours, level, stationHourlyRate, extraDiscountRate)
  },

  setStationHourlyRate: (rate) => {
    set({ stationHourlyRate: rate })
    const { selectedHours, memberLevel, extraDiscountRate } = get()
    get().calculate(selectedHours, memberLevel, rate, extraDiscountRate)
  },

  setExtraDiscountRate: (rate) => {
    set({ extraDiscountRate: rate })
    const { selectedHours, memberLevel, stationHourlyRate } = get()
    get().calculate(selectedHours, memberLevel, stationHourlyRate, rate)
  },

  calculate: (hours, memberLevel, stationRate, extraDiscount) => {
    const { tiers, selectedHours, memberLevel: currentLevel, stationHourlyRate: currentRate, extraDiscountRate: currentExtra } = get()
    const targetHours = hours ?? selectedHours
    const targetLevel = memberLevel ?? currentLevel
    const targetRate = stationRate ?? currentRate
    const targetExtra = extraDiscount ?? currentExtra
    const result = calculatePricing(targetHours, tiers, targetLevel, targetRate, targetExtra)
    set({ calculationResult: result })
    return result
  },

  addTier: (tier) => {
    const { tiers } = get()
    const newTier: PricingTier = {
      ...tier,
      id: `tier-${Date.now()}`
    }

    const updatedTiers = [...tiers, newTier]
    const validation = validateTierOverlap(updatedTiers)

    if (!validation.isValid) {
      console.error('[PricingStore] 添加档位失败:', validation.message)
      return false
    }

    console.log('[PricingStore] 添加档位:', newTier.name)
    set({ tiers: updatedTiers })
    get().reorderTiers()
    return true
  },

  updateTier: (id, updates) => {
    const { tiers } = get()
    const updatedTiers = tiers.map(t =>
      t.id === id ? { ...t, ...updates } : t
    )

    const validation = validateTierOverlap(updatedTiers)
    if (!validation.isValid) {
      console.error('[PricingStore] 更新档位失败:', validation.message)
      return false
    }

    console.log('[PricingStore] 更新档位:', id)
    set({ tiers: updatedTiers })
    get().reorderTiers()
    return true
  },

  deleteTier: (id) => {
    const { tiers } = get()
    if (tiers.length <= 1) {
      console.warn('[PricingStore] 至少保留一个档位')
      return false
    }

    console.log('[PricingStore] 删除档位:', id)
    set({
      tiers: tiers.filter(t => t.id !== id)
    })
    get().reorderTiers()
    return true
  },

  reorderTiers: () => {
    set((state) => ({
      tiers: [...state.tiers]
        .sort((a, b) => a.startHour - b.startHour)
        .map((t, i) => ({ ...t, sortOrder: i + 1 }))
    }))
  },

  resetTiers: () => {
    console.log('[PricingStore] 重置默认档位')
    set({ tiers: generateDefaultTiers() })
  },

  toggleTierActive: (id) => {
    set((state) => ({
      tiers: state.tiers.map(t =>
        t.id === id ? { ...t, isActive: !t.isActive } : t
      )
    }))
    console.log('[PricingStore] 切换档位状态:', id)
  }
}))
