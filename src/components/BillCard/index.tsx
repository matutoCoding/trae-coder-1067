import React from 'react'
import { View, Text, Button } from '@tarojs/components'
import styles from './index.module.scss'
import classnames from 'classnames'
import type { Bill, BillStatus } from '@/types'
import { MEMBER_LEVELS } from '@/types'
import { getBillStatusLabel, getBillStatusColor } from '@/data/mockBills'
import { formatCurrency, formatDuration } from '@/utils/pricing'

interface BillCardProps {
  bill: Bill
  onClick?: () => void
  onSettle?: () => void
  onAddFilm?: () => void
  showActions?: boolean
}

const statusStyleMap: Record<BillStatus, string> = {
  unpaid: styles.unpaid,
  paid: styles.paid,
  refunded: styles.refunded,
  cancelled: styles.cancelled
}

const BillCard: React.FC<BillCardProps> = ({
  bill,
  onClick,
  onSettle,
  onAddFilm,
  showActions = true
}) => {
  const remainingAmount = bill.total - (bill.refundAmount || 0)

  return (
    <View className={styles.billCard} onClick={onClick}>
      <View className={styles.cardHeader}>
        <View className={styles.billInfo}>
          <Text className={styles.billNo}>{bill.billNo}</Text>
          <Text className={styles.customerName}>{bill.photographerName}</Text>
          {bill.photographerLevel && bill.photographerLevel !== 'normal' && (
            <View
              className={styles.levelDot}
              style={{ background: MEMBER_LEVELS[bill.photographerLevel]?.color }}
            />
          )}
        </View>
        <Text
          className={classnames(styles.statusBadge, statusStyleMap[bill.status])}
          style={{ borderColor: getBillStatusColor(bill.status), color: getBillStatusColor(bill.status) }}
        >
          {getBillStatusLabel(bill.status)}
        </Text>
      </View>

      <View className={styles.cardBody}>
        <View className={styles.billMeta}>
          <View className={styles.metaItem}>
            <Text className={styles.metaLabel}>日期</Text>
            <Text className={styles.metaValue}>{bill.date}</Text>
          </View>
          <View className={styles.metaItem}>
            <Text className={styles.metaLabel}>工位</Text>
            <Text className={styles.metaValue}>{bill.stationName || '-'}</Text>
          </View>
          <View className={styles.metaItem}>
            <Text className={styles.metaLabel}>时长</Text>
            <Text className={styles.metaValue}>{formatDuration(bill.totalHours)}</Text>
          </View>
        </View>

        {bill.filmRecords.length > 0 && (
          <Text className={styles.filmCount}>
            胶片 <Text className={styles.countHighlight}>{bill.filmRecords.length}</Text> 条
          </Text>
        )}

        <View className={styles.billTotal}>
          <Text className={styles.totalLabel}>
            {bill.status === 'unpaid' ? '应付金额' : '账单金额'}
          </Text>
          <Text className={styles.totalValue}>{formatCurrency(bill.total)}</Text>
        </View>

        {bill.refundAmount > 0 && (
          <View className={styles.refundInfo}>
            <Text className={styles.refundLabel}>已退</Text>
            <Text className={styles.refundValue}>-{formatCurrency(bill.refundAmount)}</Text>
            <Text className={styles.remainingLabel}>剩余</Text>
            <Text className={styles.remainingValue}>{formatCurrency(remainingAmount)}</Text>
          </View>
        )}
      </View>

      {showActions && (
        <View className={styles.cardActions}>
          <Button
            className={classnames(styles.actionBtn, styles.detail)}
            onClick={(e) => { e.stopPropagation(); onClick?.(); }}
          >
            详情
          </Button>
          {bill.status === 'unpaid' && (
            <Button
              className={classnames(styles.actionBtn, styles.settle)}
              onClick={(e) => { e.stopPropagation(); onSettle?.(); }}
            >
              结算
            </Button>
          )}
          {bill.status !== 'cancelled' && bill.status !== 'refunded' && (
            <Button
              className={classnames(styles.actionBtn, styles.film)}
              onClick={(e) => { e.stopPropagation(); onAddFilm?.(); }}
            >
              胶片
            </Button>
          )}
        </View>
      )}
    </View>
  )
}

export default BillCard
