import React, { useMemo } from 'react'
import { View, Text, Button } from '@tarojs/components'
import styles from './index.module.scss'
import classnames from 'classnames'
import type { TimeSlot as TimeSlotType } from '@/types'
import { getSlotStatusText } from '@/utils/booking'
import { formatDuration } from '@/utils/pricing'

interface TimeSlotSelectorProps {
  slots: TimeSlotType[]
  selectedSlots: string[]
  onSlotClick: (slotId: string) => void
  onBook: () => void
  onClear: () => void
  estimatedPrice?: number
  duration?: number
  showMergeHint?: boolean
  mergeHintText?: string
}

const TimeSlotSelector: React.FC<TimeSlotSelectorProps> = ({
  slots,
  selectedSlots,
  onSlotClick,
  onBook,
  onClear,
  estimatedPrice = 0,
  duration = 0,
  showMergeHint = false,
  mergeHintText = ''
}) => {
  const selectedTimeRange = useMemo(() => {
    if (selectedSlots.length === 0) return null
    const selected = slots.filter(s => selectedSlots.includes(s.id))
      .sort((a, b) => a.startTime.localeCompare(b.startTime))
    if (selected.length === 0) return null
    return {
      start: selected[0].startTime,
      end: selected[selected.length - 1].endTime,
      count: selected.length
    }
  }, [selectedSlots, slots])

  return (
    <View>
      <View className={styles.legendBar}>
        <View className={styles.legendItem}>
          <View className={classnames(styles.legendDot, styles.available)} />
          <Text className={styles.legendText}>空闲</Text>
        </View>
        <View className={styles.legendItem}>
          <View className={classnames(styles.legendDot, styles.occupied)} />
          <Text className={styles.legendText}>占用</Text>
        </View>
        <View className={styles.legendItem}>
          <View className={classnames(styles.legendDot, styles.merged)} />
          <Text className={styles.legendText}>合并</Text>
        </View>
        <View className={styles.legendItem}>
          <View className={classnames(styles.legendDot, styles.selected)} />
          <Text className={styles.legendText}>已选</Text>
        </View>
      </View>

      <View className={styles.timeSlotGrid}>
        {slots.map(slot => (
          <View
            key={slot.id}
            className={classnames(
              styles.slotItem,
              styles[slot.status],
              selectedSlots.includes(slot.id) && styles.selected
            )}
            onClick={() => slot.status === 'available' && onSlotClick(slot.id)}
          >
            <View>
              <Text className={styles.slotTime}>{slot.startTime}</Text>
              <Text className={styles.slotLabel}>{getSlotStatusText(slot.status)}</Text>
            </View>
          </View>
        ))}
      </View>

      {selectedTimeRange && (
        <View className={styles.bookingSummary}>
          <Text className={styles.summaryTitle}>预订信息</Text>

          <View className={styles.summaryRow}>
            <Text className={styles.summaryLabel}>时段</Text>
            <Text className={styles.summaryValue}>
              {selectedTimeRange.start} - {selectedTimeRange.end}
            </Text>
          </View>

          <View className={styles.summaryRow}>
            <Text className={styles.summaryLabel}>时长</Text>
            <Text className={styles.summaryValue}>{formatDuration(duration)}</Text>
          </View>

          <View className={styles.summaryRow}>
            <Text className={styles.summaryLabel}>预估费用</Text>
            <Text className={styles.priceHighlight}>¥{estimatedPrice.toFixed(2)}</Text>
          </View>

          {showMergeHint && mergeHintText && (
            <View className={styles.mergeHint}>
              <Text className={styles.hintText}>{mergeHintText}</Text>
            </View>
          )}
        </View>
      )}

      <View className={styles.actionButtons}>
        <Button
          className={classnames(styles.actionBtn, styles.secondary)}
          onClick={onClear}
          disabled={selectedSlots.length === 0}
        >
          清空
        </Button>
        <Button
          className={classnames(styles.actionBtn, styles.primary)}
          onClick={onBook}
          disabled={selectedSlots.length === 0}
        >
          确认预订
        </Button>
      </View>
    </View>
  )
}

export default TimeSlotSelector
