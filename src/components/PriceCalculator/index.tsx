import React, { useState, useEffect } from 'react'
import { View, Text, Button, Input } from '@tarojs/components'
import styles from './index.module.scss'
import classnames from 'classnames'
import type { PricingCalculationResult, PricingTier } from '@/types'
import { calculatePricing, getTierWarningMessage } from '@/utils/pricing'

interface PriceCalculatorProps {
  tiers: PricingTier[]
  initialHours?: number
  initialDiscount?: number
  onCalculated?: (result: PricingCalculationResult) => void
  showDiscount?: boolean
}

const quickHourOptions = [1, 2, 3, 4, 6, 8]

const PriceCalculator: React.FC<PriceCalculatorProps> = ({
  tiers,
  initialHours = 1,
  initialDiscount = 0,
  onCalculated,
  showDiscount = false
}) => {
  const [hours, setHours] = useState(initialHours)
  const [discount, setDiscount] = useState(initialDiscount)
  const [discountInput, setDiscountInput] = useState(initialDiscount.toString())
  const [result, setResult] = useState<PricingCalculationResult | null>(null)

  useEffect(() => {
    const calcResult = calculatePricing(hours, tiers, discount)
    setResult(calcResult)
    onCalculated?.(calcResult)
  }, [hours, discount, tiers, onCalculated])

  const handleIncrease = () => {
    setHours(prev => Math.min(prev + 0.5, 12))
  }

  const handleDecrease = () => {
    setHours(prev => Math.max(prev - 0.5, 0.5))
  }

  const handleQuickSelect = (h: number) => {
    setHours(h)
  }

  const handleApplyDiscount = () => {
    const value = parseFloat(discountInput)
    if (!isNaN(value) && value >= 0 && value <= 1) {
      setDiscount(value)
    }
  }

  const warningMessage = result ? getTierWarningMessage(result) : null

  return (
    <View className={styles.priceCalculator}>
      <View className={styles.calculatorHeader}>
        <Text className={styles.headerTitle}>费用计算器</Text>
        <Text className={styles.headerDesc}>选择使用时长，实时计算阶梯费用</Text>
      </View>

      <View className={styles.hourSelector}>
        <Text className={styles.selectorLabel}>使用时长</Text>

        <View className={styles.hourSlider}>
          <Button
            className={styles.hourBtn}
            onClick={handleDecrease}
            disabled={hours <= 0.5}
          >
            -
          </Button>
          <View className={styles.hourDisplay}>
            <Text className={styles.hourValue}>{hours}</Text>
            <Text className={styles.hourUnit}>小时</Text>
          </View>
          <Button
            className={styles.hourBtn}
            onClick={handleIncrease}
            disabled={hours >= 12}
          >
            +
          </Button>
        </View>

        <View className={styles.quickHours}>
          {quickHourOptions.map(h => (
            <Button
              key={h}
              className={classnames(styles.quickBtn, hours === h && styles.active)}
              onClick={() => handleQuickSelect(h)}
            >
              {h}h
            </Button>
          ))}
        </View>
      </View>

      {result && (
        <View className={styles.currentTierInfo}>
          <View>
            <Text className={styles.tierLabel}>当前档位</Text>
            <Text className={styles.tierName}> {result.currentTier.name}</Text>
          </View>
          <Text className={styles.tierRate}>¥{result.currentTier.rate}/h</Text>
        </View>
      )}

      {warningMessage && (
        <View className={styles.tierWarning}>
          <Text className={styles.warningText}>⚠️ {warningMessage}</Text>
        </View>
      )}

      {result && (
        <View className={styles.priceBreakdown}>
          <Text className={styles.breakdownTitle}>费用明细</Text>

          {result.tierBreakdown.map((item, index) => (
            <View key={index} className={styles.breakdownItem}>
              <View className={styles.tierInfo}>
                <View
                  className={styles.tierDot}
                  style={{ backgroundColor: tiers.find(t => t.id === item.tierId)?.color || '#8B4513' }}
                />
                <View className={styles.tierDetails}>
                  <Text className={styles.tierName}>{item.tierName}</Text>
                  <Text className={styles.tierHours}>{item.hours}小时 × ¥{item.rate}</Text>
                </View>
              </View>
              <Text className={styles.tierAmount}>¥{item.amount.toFixed(2)}</Text>
            </View>
          ))}
        </View>
      )}

      {result && (
        <View className={styles.priceSummary}>
          <View className={styles.summaryRow}>
            <Text className={styles.summaryLabel}>小计</Text>
            <Text className={styles.summaryValue}>¥{result.stationFee.toFixed(2)}</Text>
          </View>

          {result.discountAmount > 0 && (
            <View className={styles.summaryRow}>
              <Text className={styles.summaryLabel}>折扣优惠</Text>
              <Text className={classnames(styles.summaryValue, styles.discountValue)}>
                -¥{result.discountAmount.toFixed(2)}
              </Text>
            </View>
          )}

          <View className={styles.totalRow}>
            <Text className={styles.totalLabel}>应付总额</Text>
            <Text className={styles.totalValue}>¥{result.total.toFixed(2)}</Text>
          </View>
        </View>
      )}

      {showDiscount && (
        <View className={styles.discountInput}>
          <Text className={styles.inputLabel}>折扣率 (0-1)</Text>
          <View className={styles.inputRow}>
            <Input
              className={styles.discountField}
              type='digit'
              value={discountInput}
              onInput={(e) => setDiscountInput(e.detail.value)}
              placeholder='输入折扣率，如 0.1 表示9折'
            />
            <Button className={styles.applyBtn} onClick={handleApplyDiscount}>
              应用
            </Button>
          </View>
        </View>
      )}
    </View>
  )
}

export default PriceCalculator
