import React, { useMemo } from 'react'
import { View, Text, ScrollView, Button } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import styles from './index.module.scss'
import classnames from 'classnames'
import { useScheduleStore } from '@/store/useScheduleStore'
import { usePricingStore } from '@/store/usePricingStore'
import type { Station, Booking } from '@/types'
import { formatDuration } from '@/utils/pricing'
import { getStationTypeLabel } from '@/data/mockStations'

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

    const equipment: { name: string; specs: string[] }[] = []

    if (station.type === 'black_white') {
      equipment.push({
        name: '黑白放大机',
        specs: ['135/120兼容', '最大放大8×10', '调焦精准', '对比度可调']
      })
      equipment.push({
        name: '暗房安全灯',
        specs: ['红光/黄光切换', '亮度可调', '定时开关']
      })
      equipment.push({
        name: '胶片冲洗罐',
        specs: ['135专用', '120专用', '双模式兼容']
      })
      equipment.push({
        name: '恒温水浴',
        specs: ['±0.5°C精度', '20-40°C可调', '大容量设计']
      })
    } else if (station.type === 'color') {
      equipment.push({
        name: '彩色放大机',
        specs: ['135/120兼容', '最大放大11×14', '彩色混合头', '滤镜内置']
      })
      equipment.push({
        name: '色彩分析仪',
        specs: ['自动测色', '密度读取', '三色通道调节']
      })
      equipment.push({
        name: 'C-41冲洗套药',
        specs: ['显影液', '漂定液', '稳定液', '补充液']
      })
      equipment.push({
        name: '恒温系统',
        specs: ['±0.3°C精度', '自动控温', '过热保护']
      })
    } else if (station.type === 'large_format') {
      equipment.push({
        name: '大画幅放大机',
        specs: ['4×5/8×10兼容', '最大放大16×20', '冷光源', '微调焦']
      })
      equipment.push({
        name: '大画幅冲洗盘',
        specs: ['8×10 4个', '11×14 2个', '16×20 2个']
      })
      equipment.push({
        name: '专业调焦放大镜',
        specs: ['8×10英寸', '4倍放大', '带刻度']
      })
      equipment.push({
        name: '大型水洗槽',
        specs: ['可放16×20相纸', '循环流水', '独立排水']
      })
    }

    if (station.equipment && station.equipment.length > 0) {
      station.equipment.forEach(eq => {
        if (!equipment.some(e => eq.includes(e.name))) {
          equipment.push({
            name: eq,
            specs: ['标准配置', '维护良好']
          })
        }
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
        <View className={styles.stationType}>{getStationTypeLabel(station.type)}</View>
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
