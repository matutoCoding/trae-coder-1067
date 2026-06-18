import React, { useMemo } from 'react'
import { View, Text } from '@tarojs/components'
import styles from './index.module.scss'
import classnames from 'classnames'
import type { TierBreakdownItem } from '@/types'
import { formatCurrency, formatDuration } from '@/utils/pricing'

interface TierBreakdownProps {
  totalHours: number
  tierBreakdown: TierBreakdownItem[]
  stationHourlyRate?: number
}

const TierBreakdown: React.FC<TierBreakdownProps> = ({
  totalHours,
  tierBreakdown,
  stationHourlyRate = 80
}) => {
  const maxHours = useMemo(() => {
    if (tierBreakdown.length === 0) return totalHours
    return Math.max(...tierBreakdown.map(t => t.endHour), totalHours)
  }, [tierBreakdown, totalHours])

  return (
    <View className={styles.container}>
      <View className={styles.header}>
        <Text className={styles.title}>阶梯计价明细</Text>
        <Text className={styles.totalHours}>共 {formatDuration(totalHours)}</Text>
      </View>

      <View className={styles.tiers}>
        {tierBreakdown.map((tier, index) => {
          const widthPercent = (tier.hours / maxHours) * 100
          return (
            <View key={index} className={styles.tierItem}>
              <View className={styles.tierInfo}>
                <View className={styles.tierNameRow}>
                  <Text className={styles.tierName}>{tier.tierName}</Text>
                  <Text className={styles.tierHours}>{formatDuration(tier.hours)}</Text>
                </View>
                <View className={styles.tierRateRow}>
                  <Text className={styles.tierRate}>¥{tier.rate}/小时</Text>
                  <Text className={styles.tierSubtotal}>
                    {tier.hours > 0 ? `${formatCurrency(tier.hours * tier.rate)}` : '-'}
                  </Text>
                </View>
              </View>
              <View className={styles.tierBar}>
                <View
                  className={classnames(styles.tierBarFill, `tier-${index + 1}`)}
                  style={{ width: `${Math.max(widthPercent, 5)}%` }}
                />
              </View>
            </View>
          )
        })}
      </View>

      <View className={styles.legend}>
        <View className={styles.legendItem}>
          <Text className={styles.legendText}>基础价格：¥{stationHourlyRate}/小时</Text>
        </View>
      </View>
    </View>
  )
}

export default TierBreakdown
