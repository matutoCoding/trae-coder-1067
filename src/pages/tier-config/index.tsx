import React, { useState, useMemo } from 'react'
import { View, Text, ScrollView, Input, Button, Switch } from '@tarojs/components'
import Taro from '@tarojs/taro'
import styles from './index.module.scss'
import classnames from 'classnames'
import { usePricingStore } from '@/store/usePricingStore'
import type { PricingTier } from '@/types'
import { calculatePricing, validateTierOverlap, formatCurrency } from '@/utils/pricing'

interface EditableTier extends PricingTier {
  startHourError?: string
  endHourError?: string
  rateError?: string
}

const TierConfigPage: React.FC = () => {
  const { tiers, addTier, updateTier, deleteTier, toggleTierActive } = usePricingStore()

  const [editableTiers, setEditableTiers] = useState<EditableTier[]>(
    [...tiers].sort((a, b) => a.sortOrder - b.sortOrder)
  )

  const [hasChanges, setHasChanges] = useState(false)

  const validation = useMemo(() => {
    const activeTiers = editableTiers.filter(t => t.isActive)
    const result = validateTierOverlap(activeTiers)
    return result
  }, [editableTiers])

  const priceExamples = useMemo(() => {
    const activeTiers = editableTiers.filter(t => t.isActive && !t.startHourError && !t.endHourError && !t.rateError)
    const validTiers = validateTierOverlap(activeTiers)

    if (!validTiers.isValid) return []

    const examples = [1, 3, 5, 8]
    return examples.map(hours => {
      const result = calculatePricing(hours, activeTiers)
      return { hours, price: result.total }
    })
  }, [editableTiers])

  const handleTierChange = (index: number, field: keyof PricingTier, value: any) => {
    setEditableTiers(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }

      if (field === 'startHour' || field === 'endHour') {
        const numValue = parseFloat(value)
        if (isNaN(numValue) || numValue < 0) {
          updated[index][`${field}Error`] = '请输入有效数字'
        } else if (field === 'startHour' && numValue >= updated[index].endHour) {
          updated[index][`${field}Error`] = '起始时间必须小于结束时间'
        } else if (field === 'endHour' && numValue <= updated[index].startHour) {
          updated[index][`${field}Error`] = '结束时间必须大于起始时间'
        } else {
          delete updated[index][`${field}Error`]
        }
      }

      if (field === 'rate') {
        const numValue = parseFloat(value)
        if (isNaN(numValue) || numValue <= 0) {
          updated[index]['rateError'] = '请输入有效价格'
        } else {
          delete updated[index]['rateError']
        }
      }

      return updated
    })
    setHasChanges(true)
  }

  const handleAddTier = () => {
    const maxSortOrder = Math.max(...editableTiers.map(t => t.sortOrder), 0)
    const maxEndHour = Math.max(...editableTiers.map(t => t.endHour), 0)

    const newTier: EditableTier = {
      id: `tier_${Date.now()}`,
      name: `第${maxSortOrder + 1}档`,
      startHour: maxEndHour,
      endHour: maxEndHour + 2,
      rate: 100,
      sortOrder: maxSortOrder + 1,
      isActive: true
    }

    setEditableTiers(prev => [...prev, newTier])
    setHasChanges(true)
  }

  const handleDeleteTier = async (index: number) => {
    const tier = editableTiers[index]

    const result = await Taro.showModal({
      title: '删除档位',
      content: `确定要删除"${tier.name}"吗？`,
      confirmText: '删除',
      confirmColor: '#FF4444',
      cancelText: '取消'
    })

    if (result.confirm) {
      setEditableTiers(prev => prev.filter((_, i) => i !== index))
      setHasChanges(true)
    }
  }

  const handleToggleActive = (index: number) => {
    setEditableTiers(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], isActive: !updated[index].isActive }
      return updated
    })
    setHasChanges(true)
  }

  const handleSave = async () => {
    const hasErrors = editableTiers.some(t => t.startHourError || t.endHourError || t.rateError)
    if (hasErrors) {
      Taro.showToast({ title: '请修正表单错误', icon: 'none' })
      return
    }

    if (!validation.isValid) {
      Taro.showToast({ title: validation.message || '档位配置有误', icon: 'none' })
      return
    }

    const result = await Taro.showModal({
      title: '保存配置',
      content: '确定要保存当前档位配置吗？',
      confirmText: '保存',
      cancelText: '取消'
    })

    if (result.confirm) {
      editableTiers.forEach(tier => {
        const existing = tiers.find(t => t.id === tier.id)
        if (existing) {
          updateTier(tier.id, {
            name: tier.name,
            startHour: tier.startHour,
            endHour: tier.endHour,
            rate: tier.rate,
            sortOrder: tier.sortOrder,
            isActive: tier.isActive
          })
        } else {
          addTier({
            name: tier.name,
            startHour: tier.startHour,
            endHour: tier.endHour,
            rate: tier.rate,
            sortOrder: tier.sortOrder,
            isActive: tier.isActive
          })
        }
      })

      const deletedTiers = tiers.filter(t => !editableTiers.find(et => et.id === t.id))
      deletedTiers.forEach(tier => deleteTier(tier.id))

      setHasChanges(false)
      Taro.showToast({ title: '保存成功', icon: 'success' })
    }
  }

  const handleReset = async () => {
    if (!hasChanges) {
      Taro.navigateBack()
      return
    }

    const result = await Taro.showModal({
      title: '放弃更改',
      content: '确定要放弃所有更改吗？',
      confirmText: '放弃',
      confirmColor: '#FF4444',
      cancelText: '继续编辑'
    })

    if (result.confirm) {
      Taro.navigateBack()
    }
  }

  return (
    <ScrollView className={styles.pageContainer} scrollY>
      <View className={styles.header}>
        <Text className={styles.title}>阶梯档位配置</Text>
        <Text className={styles.subtitle}>管理阶梯定价规则，按使用时长分档计价</Text>
      </View>

      {!validation.isValid && (
        <View className={styles.validationBanner}>
          <Text className={styles.bannerText}>⚠️ {validation.message}</Text>
        </View>
      )}

      <View className={styles.tierList}>
        {editableTiers.map((tier, index) => (
          <View key={tier.id} className={classnames(styles.tierCard, !tier.isActive && styles.disabled)}>
            <View className={styles.tierHeader}>
              <View className={styles.tierOrder}>{tier.sortOrder}</View>
              <View className={styles.tierActions}>
                <Button
                  className={classnames(styles.actionIcon, styles.delete)}
                  onClick={() => handleDeleteTier(index)}
                >
                  🗑️
                </Button>
              </View>
            </View>

            <View className={styles.formRow}>
              <Text className={styles.rowLabel}>档位名称</Text>
              <View className={styles.inputRow}>
                <Input
                  className={styles.input}
                  value={tier.name}
                  onInput={(e) => handleTierChange(index, 'name', e.detail.value)}
                />
              </View>
            </View>

            <View className={styles.formRow}>
              <Text className={styles.rowLabel}>时间范围（小时）</Text>
              <View className={styles.rangeInput}>
                <Input
                  className={classnames(styles.input, tier.startHourError && styles.error)}
                  type='digit'
                  value={String(tier.startHour)}
                  onInput={(e) => handleTierChange(index, 'startHour', e.detail.value)}
                />
                <Text className={styles.rangeSeparator}>-</Text>
                <Input
                  className={classnames(styles.input, tier.endHourError && styles.error)}
                  type='digit'
                  value={String(tier.endHour)}
                  onInput={(e) => handleTierChange(index, 'endHour', e.detail.value)}
                />
                <Text className={styles.unit}>h</Text>
              </View>
            </View>

            <View className={styles.formRow}>
              <Text className={styles.rowLabel}>单价（元/小时）</Text>
              <View className={styles.inputRow}>
                <Input
                  className={classnames(styles.input, tier.rateError && styles.error)}
                  type='digit'
                  value={String(tier.rate)}
                  onInput={(e) => handleTierChange(index, 'rate', e.detail.value)}
                />
                <Text className={styles.unit}>元</Text>
              </View>
            </View>

            <View className={styles.formRow}>
              <View className={styles.toggleRow}>
                <Text className={styles.toggleLabel}>启用此档位</Text>
                <Switch
                  checked={tier.isActive}
                  onChange={() => handleToggleActive(index)}
                  color='#8B4513'
                />
              </View>
            </View>
          </View>
        ))}
      </View>

      <View className={styles.addTierSection}>
        <Button className={styles.addBtn} onClick={handleAddTier}>
          <Text className={styles.plusIcon}>+</Text>
          添加新档位
        </Button>
      </View>

      {priceExamples.length > 0 && (
        <View className={styles.pricePreview}>
          <Text className={styles.previewTitle}>费用参考预览</Text>
          {priceExamples.map((example, index) => (
            <View key={index} className={styles.exampleRow}>
              <Text className={styles.hours}>{example.hours}小时</Text>
              <Text className={styles.price}>{formatCurrency(example.price)}</Text>
            </View>
          ))}
        </View>
      )}

      <View className={styles.actionBar}>
        <Button className={classnames(styles.btn, styles.secondary)} onClick={handleReset}>
          {hasChanges ? '取消' : '返回'}
        </Button>
        <Button
          className={classnames(styles.btn, styles.primary)}
          onClick={handleSave}
          disabled={!hasChanges || !validation.isValid}
        >
          保存配置
        </Button>
      </View>
    </ScrollView>
  )
}

export default TierConfigPage
