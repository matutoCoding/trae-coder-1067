import React, { useState, useMemo } from 'react'
import { View, Text, ScrollView, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
import styles from './index.module.scss'
import classnames from 'classnames'
import BillCard from '@/components/BillCard'
import { useBillsStore } from '@/store/useBillsStore'
import { formatCurrency, formatDuration } from '@/utils/pricing'
import type { Bill } from '@/types'

type FilterTab = 'all' | 'unpaid' | 'paid' | 'cancelled'

const BillsPage: React.FC = () => {
  const {
    bills,
    getTotalRevenue,
    getUnpaidAmount,
    updateBillStatus,
    setCurrentBill
  } = useBillsStore()

  const [activeTab, setActiveTab] = useState<FilterTab>('all')

  const summary = useMemo(() => {
    const totalRevenue = getTotalRevenue()
    const unpaidAmount = getUnpaidAmount()
    const unpaidCount = bills.filter(b => b.status === 'unpaid').length
    const paidCount = bills.filter(b => b.status === 'paid').length

    return {
      totalRevenue,
      unpaidAmount,
      unpaidCount,
      paidCount,
      totalCount: bills.length
    }
  }, [bills, getTotalRevenue, getUnpaidAmount])

  const filteredBills = useMemo(() => {
    let result = [...bills]

    if (activeTab !== 'all') {
      result = result.filter(b => b.status === activeTab)
    }

    return result.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }, [bills, activeTab])

  const tabCounts = useMemo(() => ({
    all: bills.length,
    unpaid: bills.filter(b => b.status === 'unpaid').length,
    paid: bills.filter(b => b.status === 'paid').length,
    cancelled: bills.filter(b => b.status === 'cancelled').length
  }), [bills])

  const handleBillDetail = (bill: Bill) => {
    setCurrentBill(bill)
    Taro.navigateTo({
      url: `/pages/bill-detail/index?id=${bill.id}`
    })
  }

  const handlePay = async (bill: Bill) => {
    const result = await Taro.showModal({
      title: '确认收款',
      content: `确认收到 ¥${bill.total.toFixed(2)} 吗？`,
      confirmText: '确认收款',
      cancelText: '取消'
    })

    if (result.confirm) {
      updateBillStatus(bill.id, 'paid')
      Taro.showToast({ title: '收款成功', icon: 'success' })
    }
  }

  const handleAddFilm = (bill: Bill) => {
    setCurrentBill(bill)
    Taro.navigateTo({
      url: `/pages/film-register/index?billId=${bill.id}`
    })
  }

  const handleQuickRegister = () => {
    Taro.navigateTo({
      url: '/pages/film-register/index'
    })
  }

  const handleNewBill = () => {
    Taro.switchTab({
      url: '/pages/schedule/index'
    })
  }

  const tabs: { key: FilterTab; label: string }[] = [
    { key: 'all', label: '全部' },
    { key: 'unpaid', label: '待支付' },
    { key: 'paid', label: '已支付' },
    { key: 'cancelled', label: '已取消' }
  ]

  return (
    <ScrollView className={styles.pageContainer} scrollY>
      <View className={styles.pageHeader}>
        <Text className={styles.headerTitle}>账单管理</Text>
        <Text className={styles.headerSubtitle}>管理收费账单与胶片冲扫登记</Text>
      </View>

      <View className={styles.summaryCard}>
        <Text className={styles.summaryTitle}>本月营收</Text>
        <Text className={styles.summaryAmount}>{formatCurrency(summary.totalRevenue)}</Text>
        <View className={styles.summaryRow}>
          <View className={styles.summaryItem}>
            <Text className={styles.itemValue}>{summary.paidCount}</Text>
            <Text className={styles.itemLabel}>已结账单</Text>
          </View>
          <View className={styles.summaryItem}>
            <Text className={styles.itemValue}>{summary.unpaidCount}</Text>
            <Text className={styles.itemLabel}>待结账单</Text>
          </View>
          <View className={styles.summaryItem}>
            <Text className={styles.itemValue}>{formatCurrency(summary.unpaidAmount)}</Text>
            <Text className={styles.itemLabel}>待收金额</Text>
          </View>
        </View>
      </View>

      <View className={styles.filterTabs}>
        {tabs.map(tab => (
          <Button
            key={tab.key}
            className={classnames(styles.tabItem, activeTab === tab.key && styles.active)}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
            <Text className={styles.badge}>{tabCounts[tab.key]}</Text>
          </Button>
        ))}
      </View>

      <View className={styles.sectionTitle}>
        <Text>账单列表</Text>
        <Text className={styles.countBadge}>共 {filteredBills.length} 条</Text>
      </View>

      <View className={styles.billList}>
        {filteredBills.length === 0 ? (
          <View className={styles.emptyState}>
            <Text className={styles.emptyIcon}>📋</Text>
            <Text className={styles.emptyText}>暂无账单记录</Text>
            <Button className={styles.actionBtn} onClick={handleNewBill}>
              创建预订
            </Button>
          </View>
        ) : (
          filteredBills.map(bill => (
            <BillCard
              key={bill.id}
              bill={bill}
              onDetail={() => handleBillDetail(bill)}
              onPay={() => handlePay(bill)}
              onAddFilm={() => handleAddFilm(bill)}
            />
          ))
        )}
      </View>

      <View className={styles.quickActions}>
        <Button className={styles.fabBtn} onClick={handleNewBill}>
          <Text className={styles.fabIcon}>📅</Text>
          <Text className={styles.fabLabel}>预订</Text>
        </Button>
        <Button className={styles.fabBtn} onClick={handleQuickRegister}>
          <Text className={styles.fabIcon}>🎞️</Text>
          <Text className={styles.fabLabel}>登记</Text>
        </Button>
      </View>
    </ScrollView>
  )
}

export default BillsPage
