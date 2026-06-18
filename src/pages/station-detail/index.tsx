import React, { useMemo } from 'react'
import { View, Text, ScrollView, Button } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import styles from './index.module.scss'
import classnames from 'classnames'
import { useScheduleStore } from '@/store/useScheduleStore'
import { usePricingStore } from '@/store/usePricingStore'
import type { Station, Booking } from '@/types'
import { formatDuration } from '@/utils/pricing'

const StationDetailPage: React.FC = () => {
  const router = useRouter()
  const { stations, bookings, setSelectedStation } = useScheduleStore()
  const { tiers } = usePricingStore()

  const stationId = router.params.id

  const station = useMemo(() =>
    stations.find(s => s.id === stationId),
    [stations, stationId]
  )

  const stationBookings = useMemo(() =>
    bookings
      .filter(b => b.stationId === stationId)
      .sort((a, b) => b.date.localeCompare(a.date) || b.startTime.localeCompare(a.startTime)),
    [bookings, stationId]
  )

  const equipmentList = useMemo(() => {
    if (!station) return []

    const equipment = []

    if (station.type === 'film_processor') {
      equipment.push({
        name: '胶片冲洗机',
        specs: ['135/120兼容', '自动控温', '定时搅拌', 'C-41/黑白双模式']
      })
      equipment.push({
        name: '暗房安全灯',
        specs: ['红光/黄光切换', '亮度可调', '定时开关']
      })
      equipment.push({
        name: '量杯组',
        specs: ['100ml', '500ml', '1000ml', '2000ml']
      })
    } else if (station.type === 'enlarger') {
      equipment.push({
        name: '放大机',
        specs: ['135/120兼容', '最大放大8×10', '彩色/黑白', '调焦精准']
      })
      equipment.push({
        name: '放大镜头',
        specs: ['50mm f/2.8', '80mm f/5.6', '105mm f/5.6']
      })
      equipment.push({
        name: '曝光计时器',
        specs: ['0.1s精度', '分段曝光', '试条模式']
      })
    } else if (station.type === 'wet_table') {
      equipment.push({
        name: '水洗工作台',
        specs: ['3槽设计', '温度控制', '独立排水', '防腐蚀材质']
      })
      equipment.push({
        name: '冲洗盘组',
        specs: ['8×10 6个', '11×14 4个', '16×20 2个']
      })
    } else if (station.type === 'scanner') {
      equipment.push({
        name: '专业扫描仪',
        specs: ['135/120/4×5', '4800dpi', '16位色彩', 'ICE除尘']
      })
      equipment.push({
        name: '色彩校准仪',
        specs: ['ICC Profile', '定期校准', '专业色彩管理']
      })
    } else {
      equipment.push({
        name: '综合工作台',
        specs: ['暗房操作', '多用途设计', '专业照明']
      })
    }

    return equipment
  }, [station])

  const handleBook = () => {
    if (station) {
      setSelectedStation(station)
      Taro.switchTab({
        url: '/pages/schedule/index'
      })
    }
  }

  const handleBack = () => {
    Taro.navigateBack()
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const month = date.getMonth() + 1
    const day = date.getDate()
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    return `${month}月${day}日 ${weekdays[date.getDay()]}`
  }

  const getStatusLabel = (status: Booking['status']) => {
    switch (status) {
      case 'active': return '进行中'
      case 'completed': return '已完成'
      case 'cancelled': return '已取消'
    }
  }

  if (!station) {
    return (
      <View className={styles.pageContainer}>
        <View className={styles.emptyState}>
          <Text className={styles.emptyIcon}>❓</Text>
          <Text className={styles.emptyText}>工位不存在</Text>
        </View>
      </View>
    )
  }

  return (
    <ScrollView className={styles.pageContainer} scrollY>
      <View className={styles.stationHeader}>
        <Text className={styles.stationName}>{station.name}</Text>
        <View className={styles.stationType}>{station.typeLabel}</View>
        <Text className={styles.stationDesc}>{station.description}</Text>
      </View>

      <View className={styles.equipmentList}>
        <Text className={styles.sectionTitle}>配套设备</Text>
        {equipmentList.map((equip, index) => (
          <View key={index} className={styles.equipmentCard}>
            <Text className={styles.equipName}>{equip.name}</Text>
            <View className={styles.equipSpecs}>
              {equip.specs.map((spec, specIndex) => (
                <Text key={specIndex} className={styles.specTag}>{spec}</Text>
              ))}
            </View>
          </View>
        ))}
      </View>

      <View className={styles.bookingHistory}>
        <Text className={styles.sectionTitle}>
          使用记录
          <Text className={styles.countBadge}>共 {stationBookings.length} 条</Text>
        </Text>
        {stationBookings.length === 0 ? (
          <View className={styles.emptyState}>
            <Text className={styles.emptyIcon}>📅</Text>
            <Text className={styles.emptyText}>暂无使用记录</Text>
          </View>
        ) : (
          stationBookings.slice(0, 10).map(booking => (
            <View key={booking.id} className={styles.historyItem}>
              <View className={styles.bookingInfo}>
                <Text className={styles.photographer}>{booking.photographerName}</Text>
                <Text className={styles.bookingTime}>
                  {formatDate(booking.date)} {booking.startTime}-{booking.endTime}
                </Text>
                <Text className={styles.bookingDuration}>
                  时长 {formatDuration(booking.duration)}
                  {booking.isMerged && ' · 合并时段'}
                </Text>
              </View>
              <View className={classnames(styles.statusTag, styles[booking.status])}>
                {getStatusLabel(booking.status)}
              </View>
            </View>
          ))
        )}
      </View>

      <View className={styles.actionBar}>
        <Button className={classnames(styles.btn, styles.secondary)} onClick={handleBack}>
          返回
        </Button>
        <Button className={classnames(styles.btn, styles.primary)} onClick={handleBook}>
          立即预订
        </Button>
      </View>
    </ScrollView>
  )
}

export default StationDetailPage
