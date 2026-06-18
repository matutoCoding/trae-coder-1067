import React, { useState, useMemo } from 'react'
import { View, Text, ScrollView, Input, Textarea, Button } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import styles from './index.module.scss'
import classnames from 'classnames'
import { useBillsStore } from '@/store/useBillsStore'
import { filmTypes, processTypes } from '@/data/mockFilms'
import type { FilmRecord } from '@/types'
import { formatCurrency } from '@/utils/pricing'

const FilmRegisterPage: React.FC = () => {
  const router = useRouter()
  const { addFilmRecord, currentBill, bills, setCurrentBill, removeFilmRecord } = useBillsStore()

  const billId = router.params.billId

  const bill = useMemo(() => {
    return bills.find(b => b.id === billId) || currentBill
  }, [bills, currentBill, billId])

  const [filmType, setFilmType] = useState<string>(filmTypes[0].value)
  const [format, setFormat] = useState<string>('135')
  const [processType, setProcessType] = useState<string>(processTypes[0].value)
  const [quantity, setQuantity] = useState<number>(1)
  const [notes, setNotes] = useState<string>('')

  const formats = [
    { key: '135', label: '135 (35mm)' },
    { key: '120', label: '120 中画幅' },
    { key: '4x5', label: '4×5 大画幅' },
    { key: '8x10', label: '8×10 大画幅' }
  ]

  const estimatedPrice = useMemo(() => {
    const filmTypeConfig = filmTypes.find(f => f.value === filmType)
    const processTypeConfig = processTypes.find(p => p.value === processType)

    if (!filmTypeConfig || !processTypeConfig) return 0

    return (filmTypeConfig.price + processTypeConfig.price) * quantity
  }, [filmType, processType, quantity])

  const handleAddFilm = () => {
    if (!bill) {
      Taro.showToast({ title: '请先关联账单', icon: 'none' })
      return
    }

    const filmRecord: FilmRecord = {
      id: `film_${Date.now()}`,
      filmType,
      format,
      processType,
      quantity,
      price: estimatedPrice,
      notes,
      createdAt: new Date().toISOString()
    }

    const success = addFilmRecord(bill.id, filmRecord)

    if (success) {
      Taro.showToast({ title: '添加成功', icon: 'success' })
      setQuantity(1)
      setNotes('')
    }
  }

  const handleQuantityChange = (delta: number) => {
    const newValue = quantity + delta
    if (newValue >= 1 && newValue <= 10) {
      setQuantity(newValue)
    }
  }

  const handleDeleteFilm = async (filmId: string) => {
    if (!bill) return

    const result = await Taro.showModal({
      title: '删除记录',
      content: '确定要删除这条胶片记录吗？',
      confirmText: '删除',
      confirmColor: '#FF4444',
      cancelText: '取消'
    })

    if (result.confirm && bill) {
      const success = removeFilmRecord(bill.id, filmId)
      if (success) {
        Taro.showToast({ title: '删除成功', icon: 'success' })
      }
    }
  }

  const handleBack = () => {
    if (bill) {
      setCurrentBill(bill)
      Taro.navigateBack()
    } else {
      Taro.switchTab({ url: '/pages/bills/index' })
    }
  }

  const handleComplete = () => {
    if (bill) {
      setCurrentBill(bill)
      Taro.showToast({ title: '登记完成', icon: 'success' })
      setTimeout(() => {
        Taro.navigateBack()
      }, 1500)
    }
  }

  return (
    <ScrollView className={styles.pageContainer} scrollY>
      {bill && (
        <View className={styles.filmList}>
          <View className={styles.quickAddSection}>
            <View className={styles.sectionHeader}>
              <Text className={styles.sectionTitle}>已登记胶片</Text>
              <Text className={styles.countBadge}>共 {bill.filmRecords.length} 卷</Text>
            </View>
          </View>
          {bill.filmRecords.length === 0 ? (
            <View className={styles.emptyState}>
              <Text className={styles.emptyIcon}>🎞️</Text>
              <Text className={styles.emptyText}>暂无冲扫记录</Text>
            </View>
          ) : (
            bill.filmRecords.map(record => (
              <View key={record.id} className={styles.filmItem}>
                <View className={styles.filmInfo}>
                  <Text className={styles.filmName}>{record.filmType}</Text>
                  <Text className={styles.filmSpecs}>
                    {record.format} · {record.processType} · {record.quantity}卷
                  </Text>
                </View>
                <Text className={styles.filmPrice}>{formatCurrency(record.price)}</Text>
                <Button
                  className={styles.deleteBtn}
                  onClick={() => handleDeleteFilm(record.id)}
                >
                  ×
                </Button>
              </View>
            ))
          )}
        </View>
      )}

      <View className={styles.formGroup}>
        <Text className={styles.formLabel}>新增冲扫记录</Text>
        <View className={styles.formCard}>
          <View className={styles.formRow}>
            <Text className={styles.rowLabel}>胶片类型</Text>
            <View className={styles.selectorGrid}>
              {filmTypes.map(type => (
                <Button
                  key={type.value}
                  className={classnames(styles.selectorItem, filmType === type.value && styles.active)}
                  onClick={() => setFilmType(type.value)}
                >
                  {type.label}
                </Button>
              ))}
            </View>
          </View>

          <View className={styles.formRow}>
            <Text className={styles.rowLabel}>胶片规格</Text>
            <View className={styles.selectorGrid}>
              {formats.map(fmt => (
                <Button
                  key={fmt.key}
                  className={classnames(styles.selectorItem, format === fmt.key && styles.active)}
                  onClick={() => setFormat(fmt.key)}
                >
                  {fmt.label}
                </Button>
              ))}
            </View>
          </View>

          <View className={styles.formRow}>
            <Text className={styles.rowLabel}>冲扫工艺</Text>
            <View className={styles.selectorGrid}>
              {processTypes.map(pt => (
                <Button
                  key={pt.value}
                  className={classnames(styles.selectorItem, processType === pt.value && styles.active)}
                  onClick={() => setProcessType(pt.value)}
                >
                  {pt.label}
                </Button>
              ))}
            </View>
          </View>

          <View className={styles.formRow}>
            <Text className={styles.rowLabel}>数量（卷）</Text>
            <View className={styles.stepperRow}>
              <Button
                className={classnames(styles.stepperBtn, quantity <= 1 && styles.disabled)}
                onClick={() => handleQuantityChange(-1)}
              >
                -
              </Button>
              <Text className={styles.stepperValue}>{quantity}</Text>
              <Button
                className={classnames(styles.stepperBtn, quantity >= 10 && styles.disabled)}
                onClick={() => handleQuantityChange(1)}
              >
                +
              </Button>
            </View>
          </View>

          <View className={styles.formRow}>
            <Text className={styles.rowLabel}>备注</Text>
            <Textarea
              className={styles.textarea}
              placeholder='输入特殊要求或备注信息...'
              value={notes}
              onInput={(e) => setNotes(e.detail.value)}
            />
          </View>

          <View className={styles.pricePreview}>
            <Text className={styles.priceLabel}>预估费用</Text>
            <Text className={styles.priceValue}>{formatCurrency(estimatedPrice)}</Text>
          </View>
        </View>
      </View>

      <View className={styles.actionBar}>
        <Button className={classnames(styles.btn, styles.secondary)} onClick={handleBack}>
          返回
        </Button>
        <Button className={classnames(styles.btn, styles.primary)} onClick={handleAddFilm}>
          添加记录
        </Button>
      </View>
    </ScrollView>
  )
}

export default FilmRegisterPage
