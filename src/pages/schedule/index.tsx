import React, { useState, useEffect, useMemo } from 'react'
import { View, Text, ScrollView, Button, Input, Textarea } from '@tarojs/components'
import Taro from '@tarojs/taro'
import styles from './index.module.scss'
import classnames from 'classnames'
import dayjs from 'dayjs'
import StationCard from '@/components/StationCard'
import Calendar from '@/components/Calendar'
import TimeSlotSelector from '@/components/TimeSlot'
import { useScheduleStore } from '@/store/useScheduleStore'
import { usePricingStore } from '@/store/usePricingStore'
import { useBillsStore } from '@/store/useBillsStore'
import { getStationTypeLabel } from '@/data/mockStations'
import { calculatePricing, formatDuration } from '@/utils/pricing'
import { calculateDuration } from '@/utils/booking'
import type { Booking, MemberLevel } from '@/types'
import { MEMBER_LEVELS } from '@/types'

const SchedulePage: React.FC = () => {
  const {
    stations,
    bookings,
    selectedDate,
    selectedStation,
    selectedSlots,
    timeSlots,
    setSelectedDate,
    setSelectedStation,
    toggleSlotSelection,
    clearSlotSelection,
    loadTimeSlots,
    createBooking,
    cancelBooking,
    splitMergedBooking,
    mergeAdjacentBookings,
    getBookingsForDate,
    getBookingsForStation
  } = useScheduleStore()

  const { tiers } = usePricingStore()
  const { generateBill } = useBillsStore()

  const [showBookingModal, setShowBookingModal] = useState(false)
  const [showSplitModal, setShowSplitModal] = useState(false)
  const [splitBookingId, setSplitBookingId] = useState<string | null>(null)
  const [splitTime, setSplitTime] = useState('')
  const [bookingForm, setBookingForm] = useState({
    photographerName: '',
    photographerId: '',
    memberLevel: 'normal' as MemberLevel,
    filmType: '',
    notes: ''
  })

  const availableStations = useMemo(() =>
    stations.filter(s => s.status === 'available'),
    [stations]
  )

  const todayBookings = useMemo(() =>
    getBookingsForDate(selectedDate),
    [getBookingsForDate, selectedDate, bookings]
  )

  const mergeSuggestion = useMemo(() => {
    if (!selectedStation) return null
    const stationBookings = getBookingsForStation(selectedStation.id, selectedDate)
    if (stationBookings.length < 2) return null
    const samePhotographer = stationBookings.reduce((acc, b) => {
      acc[b.photographerId] = (acc[b.photographerId] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    const mergeable = Object.entries(samePhotographer).find(([_, count]) => count >= 2)
    if (!mergeable) return null
    const [photographerId] = mergeable
    const photographerName = stationBookings.find(b => b.photographerId === photographerId)?.photographerName
    return { photographerId, photographerName }
  }, [selectedStation, selectedDate, bookings, getBookingsForStation])

  const estimatedPrice = useMemo(() => {
    if (selectedSlots.length === 0 || timeSlots.length === 0) return 0
    const selected = timeSlots.filter(s => selectedSlots.includes(s.id))
      .sort((a, b) => a.startTime.localeCompare(b.startTime))
    if (selected.length === 0) return 0
    const startTime = selected[0].startTime
    const endTime = selected[selected.length - 1].endTime
    const duration = calculateDuration(startTime, endTime)
    const baseRate = selectedStation?.hourlyRate || 80
    const result = calculatePricing(duration, tiers, bookingForm.memberLevel, baseRate)
    return result.total
  }, [selectedSlots, timeSlots, selectedStation, tiers, bookingForm.memberLevel])

  const selectedDuration = useMemo(() => {
    if (selectedSlots.length === 0 || timeSlots.length === 0) return 0
    const selected = timeSlots.filter(s => selectedSlots.includes(s.id))
      .sort((a, b) => a.startTime.localeCompare(b.startTime))
    if (selected.length === 0) return 0
    return calculateDuration(selected[0].startTime, selected[selected.length - 1].endTime)
  }, [selectedSlots, timeSlots])

  useEffect(() => {
    if (selectedStation) {
      loadTimeSlots(selectedStation.id, selectedDate)
    }
  }, [selectedStation, selectedDate, loadTimeSlots])

  const handleStationClick = (station: typeof stations[0]) => {
    setSelectedStation(station)
    setShowBookingModal(true)
    clearSlotSelection()
  }

  const handleCloseModal = () => {
    setShowBookingModal(false)
    clearSlotSelection()
  }

  const handleBook = () => {
    if (!bookingForm.photographerName.trim()) {
      Taro.showToast({ title: '请输入摄影师姓名', icon: 'none' })
      return
    }

    const photographerId = bookingForm.photographerId || `PH-${Date.now()}`
    const booking = createBooking(
      photographerId,
      bookingForm.photographerName.trim(),
      bookingForm.memberLevel,
      bookingForm.filmType.trim() || undefined,
      bookingForm.notes.trim() || undefined
    )

    if (booking) {
      Taro.showToast({ title: '预订成功', icon: 'success' })
      setShowBookingModal(false)
      setBookingForm({ photographerName: '', photographerId: '', memberLevel: 'normal', filmType: '', notes: '' })
      clearSlotSelection()

      const stationName = selectedStation?.name || stations.find(s => s.id === booking.stationId)?.name || ''
      const hourlyRate = selectedStation?.hourlyRate || stations.find(s => s.id === booking.stationId)?.hourlyRate || 80
      generateBill(booking, stationName, hourlyRate)
    } else {
      Taro.showToast({ title: '预订失败，请重试', icon: 'none' })
    }
  }

  const handleCancelBooking = (bookingId: string) => {
    Taro.showModal({
      title: '确认取消',
      content: '确定要取消这个预订吗？',
      success: (res) => {
        if (res.confirm) {
          const success = cancelBooking(bookingId)
          if (success) {
            Taro.showToast({ title: '已取消', icon: 'success' })
          }
        }
      }
    })
  }

  const handleSplitClick = (booking: Booking) => {
    setSplitBookingId(booking.id)
    const startHour = parseInt(booking.startTime.split(':')[0], 10)
    const endHour = parseInt(booking.endTime.split(':')[0], 10)
    const midHour = Math.floor((startHour + endHour) / 2)
    setSplitTime(`${midHour.toString().padStart(2, '0')}:00`)
    setShowSplitModal(true)
  }

  const handleSplitConfirm = () => {
    if (!splitBookingId || !splitTime) return
    const success = splitMergedBooking(splitBookingId, splitTime)
    if (success) {
      Taro.showToast({ title: '拆分成功', icon: 'success' })
      setShowSplitModal(false)
      setSplitBookingId(null)
    } else {
      Taro.showToast({ title: '拆分失败', icon: 'none' })
    }
  }

  const handleMerge = () => {
    if (!mergeSuggestion || !selectedStation) return
    const success = mergeAdjacentBookings(
      mergeSuggestion.photographerId,
      selectedStation.id,
      selectedDate
    )
    if (success) {
      Taro.showToast({ title: '合并成功', icon: 'success' })
    } else {
      Taro.showToast({ title: '没有可合并的时段', icon: 'none' })
    }
  }

  const handleGenerateBill = (booking: Booking) => {
    const stationName = stations.find(s => s.id === booking.stationId)?.name || ''
    const hourlyRate = stations.find(s => s.id === booking.stationId)?.hourlyRate || 80
    const bill = generateBill(booking, stationName, hourlyRate)
    if (bill) {
      Taro.navigateTo({
        url: `/pages/bill-detail/index?id=${bill.id}`
      })
    }
  }

  const stats = useMemo(() => ({
    totalStations: availableStations.length,
    todayBookings: todayBookings.length,
    mergedBookings: todayBookings.filter(b => b.isMerged).length
  }), [availableStations, todayBookings])

  return (
    <ScrollView className={styles.pageContainer} scrollY>
      <View className={styles.pageHeader}>
        <Text className={styles.headerTitle}>工位排期</Text>
        <Text className={styles.headerSubtitle}>管理暗房工位预订与时段分配</Text>
      </View>

      <View className={styles.statsBar}>
        <View className={styles.statCard}>
          <Text className={styles.statValue}>{stats.totalStations}</Text>
          <Text className={styles.statLabel}>可用工位</Text>
        </View>
        <View className={styles.statCard}>
          <Text className={styles.statValue}>{stats.todayBookings}</Text>
          <Text className={styles.statLabel}>今日预订</Text>
        </View>
        <View className={styles.statCard}>
          <Text className={styles.statValue}>{stats.mergedBookings}</Text>
          <Text className={styles.statLabel}>合并时段</Text>
        </View>
      </View>

      <Calendar
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        bookings={bookings}
      />

      {mergeSuggestion && (
        <View className={styles.mergeBanner}>
          <Text className={styles.bannerText}>
            发现 {mergeSuggestion.photographerName} 有可合并的相邻时段
            <Text className={styles.bannerAction} onClick={handleMerge}>立即合并</Text>
          </Text>
        </View>
      )}

      <Text className={styles.sectionTitle}>可用工位</Text>
      <View className={styles.stationList}>
        {availableStations.map(station => (
          <StationCard
            key={station.id}
            station={station}
            onClick={() => handleStationClick(station)}
          />
        ))}
      </View>

      <Text className={styles.sectionTitle}>今日预订</Text>
      <View className={styles.bookingList}>
        {todayBookings.length === 0 ? (
          <View className={styles.emptyState}>
            <Text className={styles.emptyIcon}>📅</Text>
            <Text className={styles.emptyText}>暂无预订记录</Text>
          </View>
        ) : (
          todayBookings.map(booking => (
            <View key={booking.id} className={styles.bookingItem}>
              <View className={styles.bookingHeader}>
                <Text className={styles.bookingTime}>
                  {booking.startTime} - {booking.endTime}
                </Text>
                <Text className={classnames(styles.bookingStatus, booking.isMerged ? styles.merged : styles.normal)}>
                  {booking.isMerged ? '合并时段' : '正常预订'}
                </Text>
              </View>
              <Text className={styles.bookingInfo}>
                {booking.photographerName} · {getStationTypeLabel(stations.find(s => s.id === booking.stationId)?.type || 'black_white')}
                {booking.filmType && ` · ${booking.filmType}`}
              </Text>
              <Text className={styles.bookingInfo}>
                时长: {formatDuration(booking.duration)}
                {booking.notes && ` · 备注: ${booking.notes}`}
              </Text>
              <View className={styles.bookingActions}>
                <Button
                  className={classnames(styles.actionBtn, styles.cancel)}
                  onClick={() => handleCancelBooking(booking.id)}
                >
                  取消预订
                </Button>
                {booking.isMerged && (
                  <Button
                    className={classnames(styles.actionBtn, styles.split)}
                    onClick={() => handleSplitClick(booking)}
                  >
                    拆分时段
                  </Button>
                )}
                <Button
                  className={classnames(styles.actionBtn, styles.bill)}
                  onClick={() => handleGenerateBill(booking)}
                >
                  生成账单
                </Button>
              </View>
            </View>
          ))
        )}
      </View>

      {showBookingModal && selectedStation && (
        <View className={styles.bookingModal}>
          <View className={styles.modalContent}>
            <View className={styles.modalHeader}>
              <Text className={styles.modalTitle}>预订 {selectedStation.name}</Text>
              <Button className={styles.closeBtn} onClick={handleCloseModal}>×</Button>
            </View>

            <TimeSlotSelector
              slots={timeSlots}
              selectedSlots={selectedSlots}
              onSlotClick={toggleSlotSelection}
              onBook={handleBook}
              onClear={clearSlotSelection}
              estimatedPrice={estimatedPrice}
              duration={selectedDuration}
              showMergeHint={selectedSlots.length > 1}
              mergeHintText="多个连续时段将自动合并为整段占用"
            />

            {selectedSlots.length > 0 && (
              <View className={styles.bookingForm}>
                <View className={styles.formGroup}>
                  <Text className={styles.formLabel}>摄影师姓名 *</Text>
                  <Input
                    className={styles.formInput}
                    value={bookingForm.photographerName}
                    onInput={(e) => setBookingForm({ ...bookingForm, photographerName: e.detail.value })}
                    placeholder='请输入摄影师姓名'
                  />
                </View>
                <View className={styles.formGroup}>
                  <Text className={styles.formLabel}>会员等级</Text>
                  <View className={styles.levelSelector}>
                    {Object.entries(MEMBER_LEVELS).map(([key, value]) => (
                      <View
                        key={key}
                        className={classnames(
                          styles.levelOption,
                          bookingForm.memberLevel === key && styles.active
                        )}
                        style={{
                          borderColor: bookingForm.memberLevel === key ? value.color : undefined,
                          background: bookingForm.memberLevel === key ? `${value.color}20` : undefined
                        }}
                        onClick={() => setBookingForm({ ...bookingForm, memberLevel: key as MemberLevel })}
                      >
                        <Text className={styles.levelText}>{value.label}</Text>
                        <Text className={styles.levelDiscount}>
                          {value.discountRate > 0 ? `${value.discountRate * 100}%折扣` : '无折扣'}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
                <View className={styles.formGroup}>
                  <Text className={styles.formLabel}>胶片类型</Text>
                  <Input
                    className={styles.formInput}
                    value={bookingForm.filmType}
                    onInput={(e) => setBookingForm({ ...bookingForm, filmType: e.detail.value })}
                    placeholder='如：柯达Tri-X 400'
                  />
                </View>
                <View className={styles.formGroup}>
                  <Text className={styles.formLabel}>备注</Text>
                  <Textarea
                    className={styles.formTextarea}
                    value={bookingForm.notes}
                    onInput={(e) => setBookingForm({ ...bookingForm, notes: e.detail.value })}
                    placeholder='特殊需求或备注信息'
                  />
                </View>
                <Button
                  className={styles.submitBtn}
                  onClick={handleBook}
                  disabled={!bookingForm.photographerName.trim()}
                >
                  确认预订
                </Button>
              </View>
            )}
          </View>
        </View>
      )}

      {showSplitModal && (
        <View className={styles.bookingModal}>
          <View className={styles.modalContent}>
            <View className={styles.modalHeader}>
              <Text className={styles.modalTitle}>拆分时段</Text>
              <Button className={styles.closeBtn} onClick={() => setShowSplitModal(false)}>×</Button>
            </View>
            <View className={styles.bookingForm}>
              <View className={styles.formGroup}>
                <Text className={styles.formLabel}>拆分时间点</Text>
                <Input
                  className={styles.formInput}
                  value={splitTime}
                  onInput={(e) => setSplitTime(e.detail.value)}
                  placeholder='如：12:00'
                />
                <Text className={styles.formLabel} style={{ marginTop: '16rpx' }}>
                  时段将被拆分为两部分，以此时间为界
                </Text>
              </View>
              <Button className={styles.submitBtn} onClick={handleSplitConfirm}>
                确认拆分
              </Button>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  )
}

export default SchedulePage
