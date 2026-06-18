import React from 'react'
import { View, Text, Button } from '@tarojs/components'
import styles from './index.module.scss'
import classnames from 'classnames'
import type { Bill } from '@/types'
import { getBillStatusLabel } from '@/data/mockBills'
import { formatDuration } from '@/utils/pricing'

interface BillCardProps {
  bill: Bill
  onDetail?: () => void
  onPay?: () => void
  onAddFilm?: () => void
  showActions?: boolean
}

const BillCard: React.FC<BillCardProps> = ({
  bill,
  onDetail,
  onPay,
  onAddFilm,
  showActions = true
}) => {
  return (
    <View className={styles.billCard} onClick={onDetail}>
      <View className={styles.cardHeader}>
        <View className={styles.billInfo}>
          <Text className={styles.billId}>{bill.id}</Text>
          <Text className={styles.customerName}>{bill.photographerName}</Text>
        </View>
        <Text className={classnames(styles.statusBadge, styles[bill.status])}>
          {getBillStatusLabel(bill.status)}
        </Text>
      </View>

      <View className={styles.cardBody}>
        <View className={styles.billMeta}>
          <View className={styles.metaItem}>
            <Text className={styles.metaLabel}>日期:</Text>
            <Text className={styles.metaValue}>{bill.date}</Text>
          </View>
          <View className={styles.metaItem}>
            <Text className={styles.metaLabel}>工位:</Text>
            <Text className={styles.metaValue}>{bill.stationName || '无'}</Text>
          </View>
          <View className={styles.metaItem}>
            <Text className={styles.metaLabel}>时长:</Text>
            <Text className={styles.metaValue}>{formatDuration(bill.totalHours)}</Text>
          </View>
        </View>

        <View className={styles.tierSummary}>
          {bill.tierBreakdown.map((item, index) => (
            <Text key={index} className={styles.tierTag}>
              {item.tierName}: {item.hours}h × ¥{item.rate}
            </Text>
          ))}
        </View>

        {bill.filmRecords.length > 0 && (
          <Text className={styles.filmCount}>
            胶片记录: <Text className={styles.countHighlight}>{bill.filmRecords.length}</Text> 条
          </Text>
        )}

        <View className={styles.billTotal}>
          <Text className={styles.totalLabel}>应付金额</Text>
          <Text className={styles.totalValue}>¥{bill.total.toFixed(2)}</Text>
        </View>
      </View>

      {showActions && (
        <View className={styles.cardActions}>
          <Button
            className={classnames(styles.actionBtn, styles.detail)}
            onClick={(e) => { e.stopPropagation(); onDetail?.(); }}
          >
            详情
          </Button>
          {bill.status === 'unpaid' && (
            <Button
              className={classnames(styles.actionBtn, styles.pay)}
              onClick={(e) => { e.stopPropagation(); onPay?.(); }}
            >
              结算
            </Button>
          )}
          {bill.status !== 'cancelled' && (
            <Button
              className={classnames(styles.actionBtn, styles.film)}
              onClick={(e) => { e.stopPropagation(); onAddFilm?.(); }}
            >
              胶片登记
            </Button>
          )}
        </View>
      )}
    </View>
  )
}

export default BillCard
