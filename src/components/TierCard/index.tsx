import React from 'react'
import { View, Text, Button } from '@tarojs/components'
import styles from './index.module.scss'
import classnames from 'classnames'
import type { PricingTier } from '@/types'

interface TierCardProps {
  tier: PricingTier
  isCurrent?: boolean
  showActions?: boolean
  onEdit?: () => void
  onToggle?: () => void
  onDelete?: () => void
}

const TierCard: React.FC<TierCardProps> = ({
  tier,
  isCurrent = false,
  showActions = false,
  onEdit,
  onToggle,
  onDelete
}) => {
  const rangeText = tier.endHour >= 999
    ? `${tier.startHour}小时以上`
    : `${tier.startHour}-${tier.endHour}小时`

  return (
    <View
      className={classnames(
        styles.tierCard,
        tier.isActive ? styles.active : styles.inactive
      )}
      style={{ borderLeftColor: tier.color }}
    >
      {isCurrent && (
        <View className={styles.currentTierIndicator}>当前档位</View>
      )}

      <View className={styles.cardHeader}>
        <Text className={styles.tierName}>{tier.name}</Text>
        <View
          className={styles.tierBadge}
          style={{ backgroundColor: tier.color }}
        />
      </View>

      <View className={styles.cardBody}>
        <Text className={styles.tierRange}>{rangeText}</Text>
        <Text className={styles.tierDescription}>{tier.description}</Text>

        <View className={styles.tierPricing}>
          <View>
            <Text className={styles.rateLabel}>单价</Text>
            <View>
              <Text className={styles.rateValue}>¥{tier.rate}</Text>
              <Text className={styles.rateUnit}>/小时</Text>
            </View>
          </View>
        </View>
      </View>

      {showActions && (
        <View className={styles.cardActions}>
          <Button
            className={classnames(styles.actionBtn, styles.edit)}
            onClick={onEdit}
          >
            编辑
          </Button>
          <Button
            className={classnames(styles.actionBtn, styles.toggle)}
            onClick={onToggle}
          >
            {tier.isActive ? '禁用' : '启用'}
          </Button>
          <Button
            className={classnames(styles.actionBtn, styles.delete)}
            onClick={onDelete}
          >
            删除
          </Button>
        </View>
      )}
    </View>
  )
}

export default TierCard
