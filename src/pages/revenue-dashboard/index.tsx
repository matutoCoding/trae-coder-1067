import React, { useState, useMemo, useEffect } from 'react'
import { View, Text, ScrollView, Picker } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import styles from './index.module.scss'
import classnames from 'classnames'
import dayjs from 'dayjs'
import { useBillsStore } from '@/store/useBillsStore'
import type { MemberLevel, RevenueStatItem } from '@/types'
import { MEMBER_LEVELS } from '@/types'
import { formatCurrency, formatDuration } from '@/utils/pricing'

type StatTab = 'station' | 'photographer' | 'member' | 'daily'

const RevenueDashboardPage: React.FC = () => {
  const router = useRouter()
  const { getMonthlyStats, getBillsByFilter } = useBillsStore()

  const currentMonth = dayjs().format('YYYY-MM')
  const [selectedMonth, setSelectedMonth] = useState(currentMonth)
  const [activeTab, setActiveTab] = useState<StatTab>('station')

  const months = useMemo(() => {
    const result: { label: string; value: string }[] = []
    for (let i = 0; i < 12; i++) {
      const date = dayjs().subtract(i, 'month')
      result.push({
        label: date.format('YYYY年MM月'),
        value: date.format('YYYY-MM')
      })
    }
    return result
  }, [])

  const stats = useMemo(() => {
    return getMonthlyStats(selectedMonth)
  }, [getMonthlyStats, selectedMonth])

  const handleStatClick = (type: StatTab, id: string) => {
    const params: Record<string, any> = {}
    if (type === 'station') params.stationId = id
    if (type === 'photographer') params.photographerId = id
    if (type === 'member') params.memberLevel = id as MemberLevel
    if (type === 'daily') {
      params.date = id
    } else {
      params.startDate = `${selectedMonth}-01`
      params.endDate = `${selectedMonth}-31`
    }

    const queryStr = Object.entries(params)
      .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
      .join('&')

    Taro.navigateTo({
      url: `/pages/bills/index?${queryStr}`
    })
  }

  const formatPercent = (value: number, total: number): string => {
    if (total === 0) return '0%'
    return `${Math.round((value / total) * 100)}%`
  }

  const renderStatCard = (item: RevenueStatItem, type: StatTab, totalRevenue: number) => (
    <View
      key={item.id}
      className={styles.statCard}
      onClick={() => handleStatClick(type, item.id)}
    >
      <View className={styles.statCardHeader}>
        <Text className={styles.statCardName}>{item.name}</Text>
        <Text className={styles.statCardPercent}>{formatPercent(item.totalRevenue, totalRevenue)}</Text>
      </View>
      <View className={styles.statCardBody}>
        <View className={styles.statItem}>
          <Text className={styles.statItemValue}>{formatCurrency(item.totalRevenue)}</Text>
          <Text className={styles.statItemLabel}>营收</Text>
        </View>
        <View className={styles.statItem}>
          <Text className={styles.statItemValue}>{formatDuration(item.totalHours)}</Text>
          <Text className={styles.statItemLabel}>时长</Text>
        </View>
        <View className={styles.statItem}>
          <Text className={styles.statItemValue}>{item.billCount}</Text>
          <Text className={styles.statItemLabel}>订单</Text>
        </View>
        <View className={styles.statItem}>
          <Text className={styles.statItemValue}>{formatCurrency(item.avgRevenuePerHour)}</Text>
          <Text className={styles.statItemLabel}>均价/h</Text>
        </View>
      </View>
      <View className={styles.statCardHint}>
        <Text className={styles.hintText}>点击查看明细账单 →</Text>
      </View>
    </View>
  )

  const tabs: { key: StatTab; label: string; data: RevenueStatItem[] }[] = [
    { key: 'station', label: '按工位', data: stats.stationStats },
    { key: 'photographer', label: '按摄影师', data: stats.photographerStats },
    { key: 'member', label: '按会员等级', data: stats.memberLevelStats },
    { key: 'daily', label: '按日期', data: [] }
  ]

  const activeTabData = tabs.find(t => t.key === activeTab)?.data || []

  return (
    <ScrollView className={styles.pageContainer} scrollY>
      <View className={styles.pageHeader}>
        <Text className={styles.headerTitle}>月度营收看板</Text>
        <View className={styles.monthPicker}>
          <Picker
            mode='selector'
            range={months.map(m => m.label)}
            value={months.findIndex(m => m.value === selectedMonth)}
            onChange={(e) => setSelectedMonth(months[e.detail.value].value)}
          >
            <View className={styles.pickerContent}>
              <Text className={styles.monthText}>{months.find(m => m.value === selectedMonth)?.label}</Text>
              <Text className={styles.pickerIcon}>▼</Text>
            </View>
          </Picker>
        </View>
      </View>

      <View className={styles.summaryCards}>
        <View className={styles.summaryCard}>
          <Text className={styles.summaryValue}>{formatCurrency(stats.totalRevenue)}</Text>
          <Text className={styles.summaryLabel}>实收营收</Text>
        </View>
        <View className={styles.summaryCard}>
          <Text className={styles.summaryValue}>{formatDuration(stats.totalHours)}</Text>
          <Text className={styles.summaryLabel}>使用时长</Text>
        </View>
        <View className={styles.summaryCard}>
          <Text className={styles.summaryValue}>{stats.totalBills}</Text>
          <Text className={styles.summaryLabel}>订单总数</Text>
        </View>
      </View>

      <View className={styles.tabBar}>
        {tabs.map(tab => (
          <View
            key={tab.key}
            className={classnames(styles.tabItem, activeTab === tab.key && styles.active)}
            onClick={() => setActiveTab(tab.key)}
          >
            <Text className={styles.tabText}>{tab.label}</Text>
          </View>
        ))}
      </View>

      <View className={styles.statsList}>
        {activeTab === 'daily' ? (
          stats.dailyStats.length === 0 ? (
            <View className={styles.emptyState}>
              <Text className={styles.emptyIcon}>📊</Text>
              <Text className={styles.emptyText}>暂无数据</Text>
            </View>
          ) : (
            stats.dailyStats.map(day => (
              <View
                key={day.date}
                className={styles.dailyItem}
                onClick={() => handleStatClick('daily', day.date)}
              >
                <View className={styles.dailyDate}>
                  <Text className={styles.dailyDateText}>{dayjs(day.date).format('MM月DD日')}</Text>
                  <Text className={styles.dailyWeekday}>
                    {['周日', '周一', '周二', '周三', '周四', '周五', '周六'][dayjs(day.date).day()]}
                  </Text>
                </View>
                <View className={styles.dailyStats}>
                  <View className={styles.dailyStat}>
                    <Text className={styles.dailyStatValue}>{formatCurrency(day.revenue)}</Text>
                    <Text className={styles.dailyStatLabel}>营收</Text>
                  </View>
                  <View className={styles.dailyStat}>
                    <Text className={styles.dailyStatValue}>{formatDuration(day.hours)}</Text>
                    <Text className={styles.dailyStatLabel}>时长</Text>
                  </View>
                  <Text className={styles.dailyArrow}>→</Text>
                </View>
              </View>
            ))
          )
        ) : activeTabData.length === 0 ? (
          <View className={styles.emptyState}>
            <Text className={styles.emptyIcon}>📊</Text>
            <Text className={styles.emptyText}>暂无数据</Text>
          </View>
        ) : (
          activeTabData.map(item => renderStatCard(item, activeTab, stats.totalRevenue))
        )}
      </View>

      <View className={styles.legend}>
        <Text className={styles.legendTitle}>会员等级说明</Text>
        <View className={styles.legendList}>
          {Object.entries(MEMBER_LEVELS).map(([key, value]) => (
            <View key={key} className={styles.legendItem}>
              <View className={styles.legendDot} style={{ background: value.color }} />
              <Text className={styles.legendText}>
                {value.label}: {value.discountRate > 0 ? `${value.discountRate * 100}%折扣` : '无折扣'}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  )
}

export default RevenueDashboardPage
