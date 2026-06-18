import React, { useState, useMemo } from 'react'
import { View, Text, Button } from '@tarojs/components'
import styles from './index.module.scss'
import classnames from 'classnames'
import dayjs from 'dayjs'
import type { Booking } from '@/types'

interface CalendarProps {
  selectedDate: string
  onDateChange: (date: string) => void
  bookings?: Booking[]
}

const weekdayLabels = ['日', '一', '二', '三', '四', '五', '六']

const Calendar: React.FC<CalendarProps> = ({ selectedDate, onDateChange, bookings = [] }) => {
  const [currentMonth, setCurrentMonth] = useState(dayjs(selectedDate).startOf('month'))

  const daysToShow = useMemo(() => {
    const startOfMonth = currentMonth.startOf('month')
    const endOfMonth = currentMonth.endOf('month')
    const startDay = startOfMonth.day()
    const daysInMonth = endOfMonth.date()

    const days: { date: dayjs.Dayjs; isCurrentMonth: boolean }[] = []

    for (let i = startDay - 1; i >= 0; i--) {
      days.push({
        date: startOfMonth.subtract(i + 1, 'day'),
        isCurrentMonth: false
      })
    }

    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        date: startOfMonth.date(i),
        isCurrentMonth: true
      })
    }

    const remainingDays = 42 - days.length
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        date: endOfMonth.add(i, 'day'),
        isCurrentMonth: false
      })
    }

    return days
  }, [currentMonth])

  const bookingDates = useMemo(() => {
    const dates = new Set<string>()
    bookings.forEach(b => dates.add(b.date))
    return dates
  }, [bookings])

  const handlePrevMonth = () => {
    setCurrentMonth(prev => prev.subtract(1, 'month'))
  }

  const handleNextMonth = () => {
    setCurrentMonth(prev => prev.add(1, 'month'))
  }

  const handleDateClick = (date: dayjs.Dayjs) => {
    const dateStr = date.format('YYYY-MM-DD')
    onDateChange(dateStr)
    if (!date.isSame(currentMonth, 'month')) {
      setCurrentMonth(date.startOf('month'))
    }
  }

  const today = dayjs().format('YYYY-MM-DD')
  const selectedDayjs = dayjs(selectedDate)
  const selectedBookings = bookings.filter(b => b.date === selectedDate)

  return (
    <View className={styles.calendar}>
      <View className={styles.calendarHeader}>
        <Button className={styles.navBtn} onClick={handlePrevMonth}>
          ‹
        </Button>
        <Text className={styles.monthDisplay}>
          {currentMonth.format('YYYY年MM月')}
        </Text>
        <Button className={styles.navBtn} onClick={handleNextMonth}>
          ›
        </Button>
      </View>

      <View className={styles.weekdayRow}>
        {weekdayLabels.map(label => (
          <Text key={label} className={styles.weekday}>{label}</Text>
        ))}
      </View>

      <View className={styles.daysGrid}>
        {daysToShow.map(({ date, isCurrentMonth }, index) => {
          const dateStr = date.format('YYYY-MM-DD')
          const isToday = dateStr === today
          const isSelected = dateStr === selectedDate
          const hasBooking = bookingDates.has(dateStr)

          return (
            <Button
              key={index}
              className={classnames(
                styles.dayCell,
                !isCurrentMonth && styles.otherMonth,
                isToday && styles.today,
                isSelected && styles.selected,
                hasBooking && styles.hasBooking
              )}
              onClick={() => handleDateClick(date)}
            >
              <Text className={styles.dayNumber}>{date.date()}</Text>
            </Button>
          )
        })}
      </View>

      <View className={styles.dateInfo}>
        <Text className={styles.selectedDate}>
          {selectedDayjs.format('YYYY年MM月DD日')} {selectedDayjs.format('dddd')}
        </Text>
        <Text className={styles.bookingCount}>
          当天有 <Text className={styles.countHighlight}>{selectedBookings.length}</Text> 个预订
        </Text>
      </View>
    </View>
  )
}

export default Calendar
