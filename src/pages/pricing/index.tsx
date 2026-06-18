import React, { useMemo } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import styles from './index.module.scss'
import PriceCalculator from '@/components/PriceCalculator'
import TierCard from '@/components/TierCard'
import { usePricingStore } from '@/store/usePricingStore'
import { useBillsStore } from '@/store/useBillsStore'
import type { PricingCalculationResult } from '@/types'
import { formatCurrency } from '@/utils/pricing'

const PricingPage: React.FC = () => {
  const { tiers } = usePricingStore()
  const { getTotalRevenue, getUnpaidAmount, bills } = useBillsStore()

  const stats = useMemo(() => {
    const totalRevenue = getTotalRevenue()
    const unpaidAmount = getUnpaidAmount()
    const avgBill = bills.length > 0 ? totalRevenue / bills.length : 0

    return {
      totalRevenue,
      unpaidAmount,
      avgBill,
      billCount: bills.length
    }
  }, [getTotalRevenue, getUnpaidAmount, bills])

  const handleCalculated = (result: PricingCalculationResult) => {
    console.log('[PricingPage] 计价结果:', result.total)
  }

  const handleTierConfig = () => {
    Taro.navigateTo({
      url: '/pages/tier-config/index'
    })
  }

  const examplePrices = useMemo(() => {
    const { calculatePricing } = require('@/utils/pricing')
    return [
      { hours: 1, result: calculatePricing(1, tiers) },
      { hours: 3, result: calculatePricing(3, tiers) },
      { hours: 5, result: calculatePricing(5, tiers) },
      { hours: 8, result: calculatePricing(8, tiers) }
    ]
  }, [tiers])

  const activeTiers = useMemo(() =>
    [...tiers].filter(t => t.isActive).sort((a, b) => a.sortOrder - b.sortOrder),
    [tiers]
  )

  return (
    <ScrollView className={styles.pageContainer} scrollY>
      <View className={styles.pageHeader}>
        <Text className={styles.headerTitle}>阶梯计费</Text>
        <Text className={styles.headerSubtitle}>用时越久，单价越高，逐档累加</Text>
      </View>

      <View className={styles.quickStats}>
        <View className={styles.statCard}>
          <Text className={styles.statValue}>{formatCurrency(stats.totalRevenue)}</Text>
          <Text className={styles.statLabel}>累计营收</Text>
        </View>
        <View className={styles.statCard}>
          <Text className={styles.statValue}>{formatCurrency(stats.unpaidAmount)}</Text>
          <Text className={styles.statLabel}>待收金额</Text>
        </View>
        <View className={styles.statCard} style={{ ...styles.statCard, ...styles.highlight }}>
          <Text className={styles.statValue}>{stats.billCount}</Text>
          <Text className={styles.statLabel}>账单总数</Text>
        </View>
      </View>

      <PriceCalculator
        tiers={tiers}
        initialHours={2}
        onCalculated={handleCalculated}
        showDiscount
      />

      <View className={styles.sectionTitle}>
        <Text>阶梯档位</Text>
        <Text className={styles.actionLink} onClick={handleTierConfig}>
          管理档位
        </Text>
      </View>

      <View className={styles.tierList}>
        {activeTiers.map(tier => (
          <TierCard key={tier.id} tier={tier} />
        ))}
      </View>

      <View className={styles.sectionTitle}>
        <Text>计费规则说明</Text>
      </View>

      <View className={styles.pricingRules}>
        <View className={styles.rulesCard}>
          <View className={styles.ruleItem}>
            <View className={styles.ruleIcon}>📈</View>
            <View className={styles.ruleContent}>
              <Text className={styles.ruleTitle}>阶梯递增</Text>
              <Text className={styles.ruleDesc}>
                按实际使用时长分段计价，超出基础时段后自动进入下一档位，单价逐档累加
              </Text>
            </View>
          </View>

          <View className={styles.ruleItem}>
            <View className={styles.ruleIcon}>🔔</View>
            <View className={styles.ruleContent}>
              <Text className={styles.ruleTitle}>档位临界提示</Text>
              <Text className={styles.ruleDesc}>
                当使用时长接近下一档位临界点时，系统会自动提醒，帮助合理规划时间
              </Text>
            </View>
          </View>

          <View className={styles.ruleItem}>
            <View className={styles.ruleIcon}>👥</View>
            <View className={styles.ruleContent}>
              <Text className={styles.ruleTitle}>合并时段计费</Text>
              <Text className={styles.ruleDesc}>
                同一摄影师连续预订的时段会自动合并，按总时长统一计算阶梯费用
              </Text>
            </View>
          </View>

          <View className={styles.ruleItem}>
            <View className={styles.ruleIcon}>✂️</View>
            <View className={styles.ruleContent}>
              <Text className={styles.ruleTitle}>拆分重新计价</Text>
              <Text className={styles.ruleDesc}>
                中途退订或拆分时段时，系统会自动重新计算各时段的阶梯费用
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View className={styles.sectionTitle}>
        <Text>费用参考示例</Text>
      </View>

      <View className={styles.exampleSection}>
        <View className={styles.exampleCard}>
          {examplePrices.map((example, index) => (
            <View key={index} className={styles.exampleItem}>
              <View>
                <Text className={styles.exampleHours}>{example.hours}小时</Text>
                <Text className={styles.exampleBreakdown}>
                  {example.result.tierBreakdown.map(t => `${t.tierName}×${t.hours}h`).join(' + ')}
                </Text>
              </View>
              <Text className={styles.examplePrice}>{formatCurrency(example.result.total)}</Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  )
}

export default PricingPage
