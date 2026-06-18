import React, { useMemo } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import styles from './index.module.scss'
import { useBillsStore } from '@/store/useBillsStore'
import { useScheduleStore } from '@/store/useScheduleStore'
import { formatCurrency } from '@/utils/pricing'

const MinePage: React.FC = () => {
  const { bills, getTotalRevenue } = useBillsStore()
  const { bookings, stations } = useScheduleStore()

  const userStats = useMemo(() => {
    const totalBookings = bookings.filter(b => b.status === 'active' || b.status === 'completed').length
    const totalHours = bookings.reduce((sum, b) => sum + b.duration, 0)
    const totalRevenue = getTotalRevenue()
    const filmRecords = bills.reduce((sum, b) => sum + b.filmRecords.length, 0)

    return {
      totalBookings,
      totalHours,
      totalRevenue,
      filmRecords
    }
  }, [bookings, bills, getTotalRevenue])

  const handleMenuItemClick = async (action: string) => {
    switch (action) {
      case 'tierConfig':
        Taro.navigateTo({ url: '/pages/tier-config/index' })
        break
      case 'stations':
        Taro.showToast({ title: '工位管理功能开发中', icon: 'none' })
        break
      case 'export':
        Taro.showToast({ title: '数据导出功能开发中', icon: 'none' })
        break
      case 'clearData':
        const result = await Taro.showModal({
          title: '清除数据',
          content: '确定要清除所有本地数据吗？此操作不可恢复。',
          confirmText: '确认清除',
          confirmColor: '#FF4444',
          cancelText: '取消'
        })
        if (result.confirm) {
          Taro.clearStorageSync()
          Taro.showToast({ title: '数据已清除', icon: 'success' })
          setTimeout(() => {
            Taro.reLaunch({ url: '/pages/schedule/index' })
          }, 1500)
        }
        break
      case 'about':
        Taro.showModal({
          title: '关于暗房助手',
          content: '暗房助手 v1.0.0\n\n专业摄影工作室暗房冲洗工位管理系统，提供工位排期、时段合并拆分、阶梯计费、账单生成等功能。\n\n© 2024 Darkroom Studio',
          showCancel: false,
          confirmText: '知道了'
        })
        break
      case 'help':
        Taro.showToast({ title: '帮助文档开发中', icon: 'none' })
        break
    }
  }

  const menuGroups = [
    {
      title: '业务管理',
      items: [
        {
          icon: '📊',
          title: '阶梯档位配置',
          desc: '管理阶梯定价规则和档位',
          action: 'tierConfig',
          badge: '4档'
        },
        {
          icon: '🖥️',
          title: '工位资源管理',
          desc: `共 ${stations.length} 个工位`,
          action: 'stations'
        },
        {
          icon: '📤',
          title: '数据导出',
          desc: '导出账单和预订数据',
          action: 'export'
        }
      ]
    },
    {
      title: '系统设置',
      items: [
        {
          icon: '❓',
          title: '使用帮助',
          desc: '查看操作指南和常见问题',
          action: 'help'
        },
        {
          icon: 'ℹ️',
          title: '关于我们',
          desc: '版本信息和联系方式',
          action: 'about'
        },
        {
          icon: '🗑️',
          title: '清除本地数据',
          desc: '重置所有本地存储的数据',
          action: 'clearData'
        }
      ]
    }
  ]

  return (
    <ScrollView className={styles.pageContainer} scrollY>
      <View className={styles.profileHeader}>
        <View className={styles.profileRow}>
          <View className={styles.avatar}>🎞️</View>
          <View className={styles.profileInfo}>
            <Text className={styles.userName}>暗房管理员</Text>
            <Text className={styles.userRole}>工作室管理员</Text>
            <Text className={styles.userPhone}>138****8888</Text>
          </View>
          <View className={styles.settingsIcon}>⚙️</View>
        </View>
        <View className={styles.statsRow}>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{userStats.totalBookings}</Text>
            <Text className={styles.statLabel}>总预订</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{userStats.totalHours.toFixed(1)}</Text>
            <Text className={styles.statLabel}>总工时(h)</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{formatCurrency(userStats.totalRevenue)}</Text>
            <Text className={styles.statLabel}>总营收</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{userStats.filmRecords}</Text>
            <Text className={styles.statLabel}>胶片数</Text>
          </View>
        </View>
      </View>

      {menuGroups.map((group, groupIndex) => (
        <React.Fragment key={groupIndex}>
          <Text className={styles.sectionTitle}>{group.title}</Text>
          <View className={styles.menuGroup}>
            {group.items.map((item, itemIndex) => (
              <View
                key={itemIndex}
                className={styles.menuItem}
                onClick={() => handleMenuItemClick(item.action)}
              >
                <View className={styles.menuIcon}>{item.icon}</View>
                <View className={styles.menuContent}>
                  <Text className={styles.menuTitle}>{item.title}</Text>
                  <Text className={styles.menuDesc}>{item.desc}</Text>
                </View>
                {item.badge && <Text className={styles.menuBadge}>{item.badge}</Text>}
                <Text className={styles.menuArrow}>›</Text>
              </View>
            ))}
          </View>
        </React.Fragment>
      ))}

      <View className={styles.aboutSection}>
        <Text className={styles.appLogo}>📷</Text>
        <Text className={styles.appName}>暗房助手</Text>
        <Text className={styles.appVersion}>v1.0.0</Text>
        <Text className={styles.appDesc}>
          专业摄影工作室暗房冲洗工位管理系统
        </Text>
      </View>
    </ScrollView>
  )
}

export default MinePage
