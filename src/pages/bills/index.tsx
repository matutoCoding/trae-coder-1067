import React, { useState, useMemo } from 'react'
import { View, Text, ScrollView, Button, Input, Picker } from '@tarojs/components'
import Taro, { useRouter, useDidShow } from '@tarojs/taro'
import styles from './index.module.scss'
import classnames from 'classnames'
import dayjs from 'dayjs'
import BillCard from '@/components/BillCard'
import { useBillsStore } from '@/store/useBillsStore'
import { formatCurrency } from '@/utils/pricing'
import type { Bill, BillStatus, MemberLevel } from '@/types'
import { MEMBER_LEVELS } from '@/types'
import { getBillStatusLabel } from '@/data/mockBills'

type StatusFilter = 'all' | BillStatus

const STATUS_TABS: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'unpaid', label: '待支付' },
  { key: 'paid', label: '已支付' },
  { key: 'refunded', label: '已退款' },
  { key: 'cancelled', label: '已取消' }
]

const BillsPage: React.FC = () => {
  const router = useRouter()
  const bills = useBillsStore(state => state.bills)
  const getBillsByFilter = useBillsStore(state => state.getBillsByFilter)
  const getMonthlyStats = useBillsStore(state => state.getMonthlyStats)
  const payBill = useBillsStore(state => state.payBill)

  const [activeTab, setActiveTab] = useState<StatusFilter>('all')
  const [searchText, setSearchText] = useState('')
  const [showFilter, setShowFilter] = useState(false)
  const [filterStationId, setFilterStationId] = useState('')
  const [filterPhotographerId, setFilterPhotographerId] = useState('')
  const [filterMemberLevel, setFilterMemberLevel] = useState<MemberLevel | ''>('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [dateFilter, setDateFilter] = useState('')

  useDidShow(() => {
    if (router.params) {
      if (router.params.status && ['unpaid', 'paid', 'refunded', 'cancelled'].includes(router.params.status)) {
        setActiveTab(router.params.status as StatusFilter)
      }
      if (router.params.stationId) setFilterStationId(router.params.stationId)
      if (router.params.photographerId) setFilterPhotographerId(router.params.photographerId)
      if (router.params.memberLevel) setFilterMemberLevel(router.params.memberLevel as MemberLevel)
      if (router.params.startDate) setStartDate(router.params.startDate)
      if (router.params.endDate) setEndDate(router.params.endDate)
      if (router.params.date) {
        setDateFilter(router.params.date)
        setStartDate(router.params.date)
        setEndDate(router.params.date)
      }
    }
  })

  const summary = useMemo(() => {
    const stats = getMonthlyStats(dayjs().format('YYYY-MM'))
    const unpaidBills = bills.filter(b => b.status === 'unpaid')
    const paidBills = bills.filter(b => b.status === 'paid')

    return {
      totalRevenue: stats.totalRevenue,
      unpaidAmount: unpaidBills.reduce((sum, b) => sum + b.total, 0),
      unpaidCount: unpaidBills.length,
      paidCount: paidBills.length,
      refundedCount: bills.filter(b => b.status === 'refunded' || b.status === 'cancelled').length
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
    unpaid: bills.filter(b => b.status === 'unpaid').length,
    paid: bills.filter(b => b.status === 'paid').length,
    refunded: bills.filter(b => b.status === 'refunded').length,
    cancelled: bills.filter(b => b.status === 'cancelled').length
  }), [bills])

  const filteredTotal = useMemo(() => {
    return filteredBills.reduce((sum, b) =>
      sum + Math.max(0, (b.paidAmount || 0) - (b.refundAmount || 0)), 0
    )
  }, [filteredBills])

  const handleCardClick = (bill: Bill) => {
    const param = bill.billNo
      ? `billNo=${encodeURIComponent(bill.billNo)}`
      : `id=${bill.id}`
    Taro.navigateTo({
      url: `/pages/bill-detail/index?${param}`
    })
  }

  const handleSettle = (bill: Bill) => {
    const maxAmount = bill.total
    Taro.showModal({
      title: '确认收款',
      editable: true,
      placeholderText: `应收 ${formatCurrency(maxAmount)}，实际收到：`,
      confirmText: '确认收款',
      confirmColor: '#6C5CE7',
      success: (res) => {
        if (!res.confirm) return
        const inputAmount = parseFloat(res.content || String(maxAmount))
        const payAmount = isNaN(inputAmount) ? maxAmount : Math.min(maxAmount, Math.max(0, inputAmount))
        if (payAmount <= 0) {
          Taro.showToast({ title: '收款金额必须大于0', icon: 'none' })
          return
        }
        const notes = payAmount !== maxAmount
          ? `部分收款：应收 ${formatCurrency(maxAmount)}，实收 ${formatCurrency(payAmount)}`
          : undefined
        const success = payBill(bill.id, payAmount, notes)
        if (success) {
          Taro.showToast({
            title: notes ? `已收${formatCurrency(payAmount)}` : '收款成功',
            icon: 'success'
          })
        } else {
          Taro.showToast({ title: '收款失败', icon: 'none' })
        }
      }
    })
  }

  const handleAddFilm = (bill: Bill) => {
    const param = bill.billNo
      ? `billNo=${encodeURIComponent(bill.billNo)}`
      : `id=${bill.id}`
    Taro.navigateTo({
      url: `/pages/film-register/index?${param}`
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
    setDateFilter('')
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
          <Text className={styles.summaryLabel}>实收营收</Text>
        </View>
        <View className={classnames(styles.summaryCard, styles.warning)}>
          <Text className={styles.summaryValue}>{formatCurrency(summary.unpaidAmount)}</Text>
          <Text className={styles.summaryLabel}>待收 ({summary.unpaidCount})</Text>
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

      {dateFilter && (
        <View className={styles.dateFilterBar}>
          <Text className={styles.dateFilterText}>📅 {dateFilter} 当日明细</Text>
          <Text className={styles.dateFilterTotal}>实收合计：{formatCurrency(filteredTotal)}</Text>
          <Text className={styles.clearFilterBtn} onClick={() => {
            setDateFilter('')
            setStartDate('')
            setEndDate('')
          }}>清除</Text>
        </View>
      )}

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
        {STATUS_TABS.map(tab => (
          <View
            key={tab.key}
            className={classnames(styles.tabItem, activeTab === tab.key && styles.active)}
            onClick={() => setActiveTab(tab.key)}
          >
            <Text className={styles.tabText}>{tab.label}</Text>
            <Text className={styles.tabCount}>{tabCounts[tab.key as keyof typeof tabCounts] || 0}</Text>
          </View>
        ))}
      </View>

      <View className={styles.billList}>
        {filteredBills.length === 0 ? (
          <View className={styles.emptyState}>
            <Text className={styles.emptyIcon}>📋</Text>
            <Text className={styles.emptyText}>暂无符合条件的账单</Text>
          </View>
        ) : (
          filteredBills.map(bill => (
            <BillCard
              key={bill.id}
              bill={bill}
              onClick={() => handleCardClick(bill)}
              onSettle={() => handleSettle(bill)}
              onAddFilm={() => handleAddFilm(bill)}
            />
          ))
        )}
      </View>

      <View className={styles.listFooter}>
        <Text className={styles.footerText}>共 {filteredBills.length} 条记录 · 实收合计 {formatCurrency(filteredTotal)}</Text>
      </View>
    </ScrollView>
  )
}

export default BillsPage
