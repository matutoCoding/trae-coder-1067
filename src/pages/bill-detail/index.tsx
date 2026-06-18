import React, { useMemo } from 'react'
import { View, Text, ScrollView, Button } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import styles from './index.module.scss'
import classnames from 'classnames'
import { useBillsStore } from '@/store/useBillsStore'
import { useScheduleStore } from '@/store/useScheduleStore'
import type { Bill } from '@/types'
import { formatCurrency, formatDuration } from '@/utils/pricing'

const BillDetailPage: React.FC = () => {
  const router = useRouter()
  const { bills, updateBillStatus, setCurrentBill, addFilmRecord, generateBill, currentBill } = useBillsStore()
  const { stations, bookings, getStationById } = useScheduleStore()

  const billId = router.params.id

  const bill = useMemo(() =>
    bills.find(b => b.id === billId) || (currentBill && currentBill.id === billId ? currentBill : null),
    [bills, currentBill, billId]
  )

  const booking = useMemo(() =>
    bill ? bookings.find(b => b.id === bill.bookingId) : null,
    [bill, bookings]
  )

  const station = useMemo(() => {
    if (!bill) return null
    if (bill.stationId) {
      const found = getStationById(bill.stationId)
      if (found) return found
    }
    if (booking) {
      return getStationById(booking.stationId)
    }
    if (bill.stationName) {
      return {
        id: bill.stationId || '',
        name: bill.stationName,
        type: 'black_white' as const,
        description: '',
        equipment: [],
        capacity: 0,
        status: 'available' as const,
        hourlyRate: 0,
        createdAt: ''
      }
    }
    return null
  }, [bill, booking, getStationById])

  const handlePay = async () => {
    if (!bill) return

    const result = await Taro.showModal({
      title: '确认收款',
      content: `确认收到 ${formatCurrency(bill.total)} 吗？`,
      confirmText: '确认收款',
      cancelText: '取消'
    })

    if (result.confirm) {
      updateBillStatus(bill.id, 'paid')
      Taro.showToast({ title: '收款成功', icon: 'success' })
    }
  }

  const handleCancel = async () => {
    if (!bill) return

    const result = await Taro.showModal({
      title: '取消账单',
      content: '确定要取消此账单吗？',
      confirmText: '确定取消',
      confirmColor: '#FF4444',
      cancelText: '返回'
    })

    if (result.confirm) {
      updateBillStatus(bill.id, 'cancelled')
      Taro.showToast({ title: '已取消', icon: 'success' })
      setTimeout(() => Taro.navigateBack(), 1000)
    }
  }

  const handleAddFilm = () => {
    if (!bill) return
    setCurrentBill(bill)
    Taro.navigateTo({
      url: `/pages/film-register/index?billId=${bill.id}`
    })
  }

  const handleRegenerate = async () => {
    if (!bill || !booking) return

    const result = await Taro.showModal({
      title: '重新计价',
      content: '确定要根据当前阶梯价格重新计算费用吗？',
      confirmText: '重新计价',
      cancelText: '取消'
    })

    if (result.confirm) {
      const newBill = generateBill(
        booking,
        bill.filmRecords
      )

      if (newBill) {
        Taro.showToast({ title: '已重新计价', icon: 'success' })
      }
    }
  }

  const getStatusLabel = (status: Bill['status']) => {
    switch (status) {
      case 'unpaid': return '待支付'
      case 'paid': return '已支付'
      case 'cancelled': return '已取消'
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  }

  if (!bill) {
    return (
      <View className={styles.pageContainer}>
        <View className={styles.emptyState}>
          <Text className={styles.emptyIcon}>❓</Text>
          <Text className={styles.emptyText}>账单不存在</Text>
        </View>
      </View>
    )
  }

  return (
    <ScrollView className={styles.pageContainer} scrollY>
      <View className={styles.billHeader}>
        <View className={styles.billStatus}>{getStatusLabel(bill.status)}</View>
        <Text className={styles.billAmount}>{formatCurrency(bill.total)}</Text>
        <View className={styles.billInfo}>
          <View className={styles.infoItem}>
            <Text className={styles.infoLabel}>账单编号</Text>
            <Text className={styles.infoValue}>{bill.billNo}</Text>
          </View>
          <View className={styles.infoItem}>
            <Text className={styles.infoLabel}>创建时间</Text>
            <Text className={styles.infoValue}>{formatDate(bill.createdAt)}</Text>
          </View>
        </View>
      </View>

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>基本信息</Text>
        <View className={styles.card}>
          <View className={styles.infoRow}>
            <Text className={styles.label}>摄影师</Text>
            <Text className={styles.value}>{bill.photographerName}</Text>
          </View>
          <View className={styles.infoRow}>
            <Text className={styles.label}>使用工位</Text>
            <Text className={styles.value}>{station?.name || '-'}</Text>
          </View>
          {booking && (
            <View className={styles.infoRow}>
              <Text className={styles.label}>使用时段</Text>
              <Text className={styles.value}>
                {formatDate(booking.date)} {booking.startTime}-{booking.endTime}
              </Text>
            </View>
          )}
          <View className={styles.infoRow}>
            <Text className={styles.label}>使用时长</Text>
            <Text className={styles.value}>{formatDuration(bill.totalHours)}</Text>
          </View>
          {booking?.isMerged && (
            <View className={styles.infoRow}>
              <Text className={styles.label}>时段类型</Text>
              <Text className={styles.valueHighlight}>合并时段</Text>
            </View>
          )}
        </View>
      </View>

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>
          阶梯计费明细
          <Text className={styles.actionLink} onClick={handleRegenerate}>重新计价</Text>
        </Text>
        <View className={styles.card}>
          <View className={styles.tierBreakdown}>
            {bill.tierBreakdown.map((item, index) => (
              <View key={index} className={styles.tierItem}>
                <View className={styles.tierInfo}>
                  <Text className={styles.tierName}>{item.tierName}</Text>
                  <Text className={styles.tierDetail}>
                    {item.hours.toFixed(1)}小时 × {formatCurrency(item.rate)}/小时
                  </Text>
                </View>
                <Text className={styles.tierPrice}>{formatCurrency(item.amount)}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>
          胶片冲扫记录
          <Text className={styles.actionLink} onClick={handleAddFilm}>添加</Text>
        </Text>
        <View className={styles.card}>
          {bill.filmRecords.length === 0 ? (
            <View className={styles.emptyState}>
              <Text className={styles.emptyIcon}>🎞️</Text>
              <Text className={styles.emptyText}>暂无冲扫记录</Text>
            </View>
          ) : (
            <View className={styles.filmRecords}>
              {bill.filmRecords.map((record, index) => (
                <View key={index} className={styles.filmItem}>
                  <View className={styles.filmInfo}>
                    <Text className={styles.filmName}>{record.filmType}</Text>
                    <Text className={styles.filmSpecs}>
                      {record.format} · {record.processType} · {record.quantity}卷
                    </Text>
                  </View>
                  <Text className={styles.filmPrice}>{formatCurrency(record.price)}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </View>

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>费用合计</Text>
        <View className={styles.summaryCard}>
          <View className={styles.summaryRow}>
            <Text className={styles.label}>工位使用费</Text>
            <Text className={styles.value}>{formatCurrency(bill.stationFee)}</Text>
          </View>
          <View className={styles.summaryRow}>
            <Text className={styles.label}>胶片冲扫费</Text>
            <Text className={styles.value}>{formatCurrency(bill.filmFee)}</Text>
          </View>
          {bill.discountAmount > 0 && (
            <View className={styles.summaryRow}>
              <Text className={styles.label}>优惠折扣</Text>
              <Text className={styles.value}>-{formatCurrency(bill.discountAmount)}</Text>
            </View>
          )}
          <View className={classnames(styles.summaryRow, styles.total)}>
            <Text className={styles.label}>应付总额</Text>
            <Text className={styles.value}>{formatCurrency(bill.total)}</Text>
          </View>
        </View>
      </View>

      {bill.notes && (
        <View className={styles.section}>
          <Text className={styles.sectionTitle}>备注</Text>
          <View className={styles.card}>
            <Text style={{ fontSize: '28rpx', color: '#9A9ABF', lineHeight: 1.6 }}>
              {bill.notes}
            </Text>
          </View>
        </View>
      )}

      <View className={styles.actionBar}>
        {bill.status === 'unpaid' && (
          <>
            <Button className={classnames(styles.btn, styles.danger)} onClick={handleCancel}>
              取消
            </Button>
            <Button className={classnames(styles.btn, styles.primary)} onClick={handlePay}>
              确认收款
            </Button>
          </>
        )}
        {bill.status !== 'unpaid' && (
          <Button className={classnames(styles.btn, styles.secondary)} onClick={() => Taro.navigateBack()}>
            返回
          </Button>
        )}
      </View>
    </ScrollView>
  )
}

export default BillDetailPage
