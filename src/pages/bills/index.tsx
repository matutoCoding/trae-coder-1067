import React, { useState, useMemo, useEffect } from 'react'
import { View, Text, ScrollView, Button, Input, Picker } from '@tarojs/components'
import Taro, { useRouter, useDidShow } from '@tarojs/taro'
import styles from './index.module.scss'
import classnames from 'classnames'
import dayjs from 'dayjs'
import BillCard from '@/components/BillCard'
import { useBillsStore } from '@/store/useBillsStore'
import { formatCurrency, formatDuration } from '@/utils/pricing'
import type { Bill, BillStatus, MemberLevel } from '@/types'
import { MEMBER_LEVELS } from '@/types'

type StatusFilter = 'all' | 'pending' | 'paid' | 'refunded' | 'cancelled'

const BillsPage: React.FC = () => {
  const router = useRouter()
  const {
    bills,
    getBillsByFilter,
    getMonthlyStats,
    setCurrentBill,
    payBill
  } = useBillsStore()

  const [activeTab, setActiveTab] = useState<StatusFilter>('all')
  const [searchText, setSearchText] = useState('')
  const [showFilter, setShowFilter] = useState(false)
  const [filterStationId, setFilterStationId] = useState('')
  const [filterPhotographerId, setFilterPhotographerId] = useState('')
  const [filterMemberLevel, setFilterMemberLevel] = useState<MemberLevel | ''>('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  useDidShow(() => {
    if (router.params) {
      if (router.params.status) setActiveTab(router.params.status as StatusFilter)
      if (router.params.stationId) setFilterStationId(router.params.stationId)
      if (router.params.photographerId) setFilterPhotographerId(router.params.photographerId)
      if (router.params.memberLevel) setFilterMemberLevel(router.params.memberLevel as MemberLevel)
      if (router.params.startDate) setStartDate(router.params.startDate)
      if (router.params.endDate) setEndDate(router.params.endDate)
    }
  })

  const summary = useMemo(() => {
    const stats = getMonthlyStats(dayjs().format('YYYY-MM'))
    const pendingCount = bills.filter(b => b.status === 'pending').length
    const pendingAmount = bills.filter(b => b.status === 'pending').reduce((sum, b) => sum + b.total, 0)
    const paidCount = bills.filter(b => b.status === 'paid').length
    const refundedCount = bills.filter(b => b.status === 'refunded' || b.status === 'cancelled').length

    return {
      totalRevenue: stats.totalRevenue,
      pendingAmount,
      pendingCount,
      paidCount,
      refundedCount,
      totalCount: bills.length
    }
  }, [bills, getMonthlyStats])

  const filteredBills = useMemo(() => {
    const filter: any = {}
    if (activeTab !== 'all') filter.status = activeTab as BillStatus
    if (filterStationId) filter.stationId = filterStationId
    if (filterPhotographerId) filter.photographerId = filterPhotographerId
    if (filterMemberLevel) filter.memberLevel = filterMemberLevel
    if (startDate) filter.startDate = startDate
    if (endDate) filter.endDate = endDate

    let result = getBillsByFilter(filter)

    if (searchText) {
      const search = searchText.toLowerCase()
      result = result.filter(b =>
        b.photographerName.toLowerCase().includes(search) ||
        b.billNo.toLowerCase().includes(search) ||
        (b.stationName && b.stationName.toLowerCase().includes(search))
      )
    }

    return result
  }, [bills, activeTab, searchText, filterStationId, filterPhotographerId, filterMemberLevel, startDate, endDate, getBillsByFilter])

  const tabCounts = useMemo(() => ({
    all: bills.length,
    pending: bills.filter(b => b.status === 'pending').length,
    paid: bills.filter(b => b.status === 'paid').length,
    refunded: bills.filter(b => b.status === 'refunded').length,
    cancelled: bills.filter(b => b.status === 'cancelled').length
  }), [bills])

  const tabs: { key: StatusFilter; label: string }[] = [
    { key: 'all', label: '全部' },
    { key: 'pending', label: '待支付' },
    { key: 'paid', label: '已支付' },
    { key: 'refunded', label: '已退款' },
    { key: 'cancelled', label: '已取消' }
  ]

  const handleBillDetail = (bill: Bill) => {
    setCurrentBill(bill)
    Taro.navigateTo({
      url: `/pages/bill-detail/index?id=${bill.id}`
    })
  }

  const handleQuickPay = (bill: Bill) => {
    Taro.showModal({
      title: '确认收款',
      content: `确认收到 ${formatCurrency(bill.total)} 吗？`,
      confirmText: '确认收款',
      success: (res) => {
        if (res.confirm) {
          const success = payBill(bill.id)
          if (success) {
            Taro.showToast({ title: '收款成功', icon: 'success' })
          }
        }
      }
    })
  }

  const handleAddFilm = (bill: Bill) => {
    setCurrentBill(bill)
    Taro.navigateTo({
      url: `/pages/film-register/index?billId=${bill.id}`
    })
  }

  const handleResetFilter = () => {
    setActiveTab('all')
    setSearchText('')
    setFilterStationId('')
    setFilterPhotographerId('')
    setFilterMemberLevel('')
    setStartDate('')
    setEndDate('')
  }

  const memberLevelOptions = [
    { label: '全部等级', value: '' },
    ...Object.entries(MEMBER_LEVELS).map(([key, val]) => ({
      label: val.label,
      value: key
    }))
  ]

  return (
    <ScrollView className={styles.pageContainer} scrollY>
      <View className={styles.pageHeader}>
        <View className={styles.headerRow}>
          <View>
            <Text className={styles.headerTitle}>账单管理</Text>
            <Text className={styles.headerSubtitle}>管理所有订单的收费流程</Text>
          </View>
          <Text className={styles.dashboardBtn} onClick={() => Taro.navigateTo({ url: '/pages/revenue-dashboard/index' })}>
            营收看板
          </Text>
        </View>
      </View>

      <View className={styles.summaryCards}>
        <View className={styles.summaryCard}>
          <Text className={styles.summaryValue}>{formatCurrency(summary.totalRevenue)}</Text>
          <Text className={styles.summaryLabel}>本月营收</Text>
        </View>
        <View className={classnames(styles.summaryCard, styles.warning)}>
          <Text className={styles.summaryValue}>{formatCurrency(summary.pendingAmount)}</Text>
          <Text className={styles.summaryLabel}>待收 ({summary.pendingCount})</Text>
        </View>
        <View className={styles.summaryCard}>
          <Text className={styles.summaryValue}>{summary.paidCount}</Text>
          <Text className={styles.summaryLabel}>已完成</Text>
        </View>
      </View>

      <View className={styles.searchBar}>
        <Input
          className={styles.searchInput}
          placeholder='搜索摄影师、账单号、工位'
          value={searchText}
          onInput={e => setSearchText(e.detail.value)}
        />
        <Text className={styles.filterBtn} onClick={() => setShowFilter(!showFilter)}>
          {showFilter ? '收起' : '筛选'}
        </Text>
      </View>

      {showFilter && (
        <View className={styles.filterPanel}>
          <View className={styles.filterRow}>
            <Text className={styles.filterLabel}>会员等级</Text>
            <Picker
              mode='selector'
              range={memberLevelOptions.map(o => o.label)}
              value={memberLevelOptions.findIndex(o => o.value === filterMemberLevel)}
              onChange={e => setFilterMemberLevel(memberLevelOptions[e.detail.value].value as MemberLevel | '')}
            >
              <View className={styles.filterPicker}>
                <Text className={styles.filterPickerText}>
                  {memberLevelOptions.find(o => o.value === filterMemberLevel)?.label || '全部'}
                </Text>
                <Text className={styles.pickerArrow}>▼</Text>
              </View>
            </Picker>
          </View>
          <View className={styles.filterRow}>
            <Text className={styles.filterLabel}>开始日期</Text>
            <Input
              className={styles.filterInput}
              type='text'
              placeholder='YYYY-MM-DD'
              value={startDate}
              onInput={e => setStartDate(e.detail.value)}
            />
          </View>
          <View className={styles.filterRow}>
            <Text className={styles.filterLabel}>结束日期</Text>
            <Input
              className={styles.filterInput}
              type='text'
              placeholder='YYYY-MM-DD'
              value={endDate}
              onInput={e => setEndDate(e.detail.value)}
            />
          </View>
          <View className={styles.filterActions}>
            <Button className={styles.btnReset} onClick={handleResetFilter}>重置</Button>
          </View>
        </View>
      )}

      <View className={styles.tabBar}>
        {tabs.map(tab => (
          <View
            key={tab.key}
            className={classnames(styles.tabItem, activeTab === tab.key && styles.active)}
            onClick={() => setActiveTab(tab.key)}
          >
            <Text className={styles.tabText}>{tab.label}</Text>
            <Text className={styles.tabCount}>{tabCounts[tab.key]}</Text>
          </View>
        ))}
      </View>

      <View className={styles.billList}>
        {filteredBills.length === 0 ? (
          <View className={styles.emptyState}>
            <Text className={styles.emptyIcon}>�</Text>
            <Text className={styles.emptyText}>暂无符合条件的账单</Text>
          </View>
        ) : (
          filteredBills.map(bill => (
            <BillCard
              key={bill.id}
              bill={bill}
              onClick={() => handleBillDetail(bill)}
              onQuickPay={bill.status === 'pending' ? () => handleQuickPay(bill) : undefined}
              onAddFilm={() => handleAddFilm(bill)}
            />
          ))
        )}
      </View>

      <View className={styles.listFooter}>
        <Text className={styles.footerText}>共 {filteredBills.length} 条记录</Text>
      </View>
    </ScrollView>
  )
}

export default BillsPage
