import React, { useState, useMemo, useEffect } from 'react'
import { View, Text, ScrollView, Input, Textarea, Button, Picker } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import styles from './index.module.scss'
import classnames from 'classnames'
import { useBillsStore } from '@/store/useBillsStore'
import { filmTypes, processTypes, formatOptions } from '@/data/mockFilms'
import type { FilmFormat } from '@/types'
import { calculateFilmPrice, formatCurrency } from '@/utils/pricing'

const FilmRegisterPage: React.FC = () => {
  const router = useRouter()
  const { addFilmRecord, getBillById, currentBill, setCurrentBill, removeFilmRecord } = useBillsStore()

  const billId = router.params.billId as string

  const bill = useMemo(() => {
    return currentBill || (billId ? getBillById(billId) : null)
  }, [currentBill, billId, getBillById])

  const [filmType, setFilmType] = useState<string>(filmTypes[0].value)
  const [format, setFormat] = useState<FilmFormat | string>('135')
  const [processType, setProcessType] = useState<string>(processTypes[0].value)
  const [quantity, setQuantity] = useState<number>(1)
  const [notes, setNotes] = useState<string>('')

  const filmTypeIndex = useMemo(() =>
    filmTypes.findIndex(f => f.value === filmType),
    [filmType]
  )

  const processTypeIndex = useMemo(() =>
    processTypes.findIndex(p => p.value === processType),
    [processType]
  )

  const formatIndex = useMemo(() =>
    formatOptions.findIndex(f => f.value === format),
    [format]
  )

  const estimatedPrice = useMemo(() => {
    return calculateFilmPrice(filmType, processType, quantity, format)
  }, [filmType, processType, quantity, format])

  const formatMultiplier = useMemo(() => {
    const fmt = formatOptions.find(f => f.value === format)
    return fmt?.multiplier || 1
  }, [format])

  const handleAddFilm = () => {
    if (!bill) {
      Taro.showToast({ title: '请先关联账单', icon: 'none' })
      return
    }

    const success = addFilmRecord(bill.id, {
      filmType,
      format,
      processType,
      quantity,
      notes: notes || undefined
    })

    if (success) {
      Taro.showToast({ title: '添加成功', icon: 'success' })
      setQuantity(1)
      setNotes('')
    } else {
      Taro.showToast({ title: '添加失败', icon: 'none' })
    }
  }

  const handleDeleteFilm = (recordId: string) => {
    if (!bill) return
    Taro.showModal({
      title: '确认删除',
      content: '确定要删除这条胶片记录吗？',
      success: (res) => {
        if (res.confirm) {
          const success = removeFilmRecord(bill.id, recordId)
          if (success) {
            Taro.showToast({ title: '已删除', icon: 'success' })
          }
        }
      }
    })
  }

  useEffect(() => {
    if (billId && !bill) {
      const found = getBillById(billId)
      if (found) setCurrentBill(found)
    }
  }, [billId, bill, getBillById, setCurrentBill])

  if (!bill) {
    return (
      <View className={styles.emptyState}>
        <Text className={styles.emptyIcon}>🎞️</Text>
        <Text className={styles.emptyText}>请先选择要添加胶片的账单</Text>
      </View>
    )
  }

  return (
    <ScrollView className={styles.pageContainer} scrollY>
      <View className={styles.pageHeader}>
        <Text className={styles.headerTitle}>胶片冲扫登记</Text>
        <Text className={styles.headerSubtitle}>账单：{bill.billNo}</Text>
      </View>

      <View className={styles.section}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>当前账单信息</Text>
        </View>
        <View className={styles.billInfoCard}>
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>摄影师</Text>
            <Text className={styles.infoValue}>{bill.photographerName}</Text>
          </View>
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>当前总金额</Text>
            <Text className={styles.infoValueHighlight}>{formatCurrency(bill.total)}</Text>
          </View>
        </View>
      </View>

      <View className={styles.section}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>添加胶片</Text>
        </View>
        <View className={styles.formCard}>
          <View className={styles.formItem}>
            <Text className={styles.formLabel}>胶片类型</Text>
            <Picker
              mode='selector'
              range={filmTypes.map(f => f.label)}
              value={filmTypeIndex}
              onChange={e => setFilmType(filmTypes[e.detail.value].value)}
            >
              <View className={styles.formPicker}>
                <Text className={styles.pickerText}>{filmTypes[filmTypeIndex]?.label}</Text>
                <Text className={styles.pickerHint}>¥{filmTypes[filmTypeIndex]?.price}/卷</Text>
                <Text className={styles.pickerArrow}>▼</Text>
              </View>
            </Picker>
          </View>

          <View className={styles.formItem}>
            <Text className={styles.formLabel}>规格</Text>
            <View className={styles.formatGrid}>
              {formatOptions.map(fmt => (
                <View
                  key={fmt.value}
                  className={classnames(styles.formatItem, format === fmt.value && styles.active)}
                  onClick={() => setFormat(fmt.value)}
                >
                  <Text className={styles.formatLabel}>{fmt.label}</Text>
                  <Text className={styles.formatMultiplier}>×{fmt.multiplier}</Text>
                </View>
              ))}
            </View>
          </View>

          <View className={styles.formItem}>
            <Text className={styles.formLabel}>冲洗工艺</Text>
            <Picker
              mode='selector'
              range={processTypes.map(p => p.label)}
              value={processTypeIndex}
              onChange={e => setProcessType(processTypes[e.detail.value].value)}
            >
              <View className={styles.formPicker}>
                <Text className={styles.pickerText}>{processTypes[processTypeIndex]?.label}</Text>
                <Text className={styles.pickerHint}>¥{processTypes[processTypeIndex]?.price}/卷</Text>
                <Text className={styles.pickerArrow}>▼</Text>
              </View>
            </Picker>
          </View>

          <View className={styles.formItem}>
            <Text className={styles.formLabel}>数量</Text>
            <View className={styles.quantityRow}>
              <View
                className={styles.quantityBtn}
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
              >
                <Text className={styles.quantityBtnText}>-</Text>
              </View>
              <Text className={styles.quantityValue}>{quantity}</Text>
              <View
                className={styles.quantityBtn}
                onClick={() => setQuantity(quantity + 1)}
              >
                <Text className={styles.quantityBtnText}>+</Text>
              </View>
              <Text className={styles.quantityUnit}>卷</Text>
            </View>
          </View>

          <View className={styles.formItem}>
            <Text className={styles.formLabel}>备注</Text>
            <Textarea
              className={styles.formTextarea}
              placeholder='可选，输入特殊要求等'
              value={notes}
              onInput={e => setNotes(e.detail.value)}
            />
          </View>

          <View className={styles.pricePreview}>
            <View className={styles.priceRow}>
              <Text className={styles.priceLabel}>单价合计</Text>
              <Text className={styles.priceValue}>
                {formatCurrency(filmTypes[filmTypeIndex]?.price || 0)} + {formatCurrency(processTypes[processTypeIndex]?.price || 0)}
              </Text>
            </View>
            {formatMultiplier > 1 && (
              <View className={styles.priceRow}>
                <Text className={styles.priceLabel}>规格系数</Text>
                <Text className={styles.priceValue}>×{formatMultiplier}</Text>
              </View>
            )}
            <View className={styles.priceRow}>
              <Text className={styles.priceLabel}>数量</Text>
              <Text className={styles.priceValue}>×{quantity}</Text>
            </View>
            <View className={styles.priceRowTotal}>
              <Text className={styles.totalLabel}>预估金额</Text>
              <Text className={styles.totalValue}>{formatCurrency(estimatedPrice)}</Text>
            </View>
          </View>

          <Button className={styles.btnAdd} onClick={handleAddFilm}>
            添加到账单
          </Button>
        </View>
      </View>

      <View className={styles.section}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>已添加胶片 ({bill.filmRecords.length})</Text>
        </View>
        {bill.filmRecords.length === 0 ? (
          <View className={styles.emptyList}>
            <Text className={styles.emptyListText}>暂无胶片记录</Text>
          </View>
        ) : (
          <View className={styles.filmList}>
            {bill.filmRecords.map(record => (
              <View key={record.id} className={styles.filmItem}>
                <View className={styles.filmInfo}>
                  <View className={styles.filmRow}>
                    <Text className={styles.filmName}>{record.filmType}</Text>
                    <View className={styles.formatBadge}>
                      <Text className={styles.formatText}>{record.format}</Text>
                    </View>
                  </View>
                  <Text className={styles.filmMeta}>
                    {record.processType} · {record.quantity}卷
                  </Text>
                </View>
                <View className={styles.filmActions}>
                  <Text className={styles.filmPrice}>{formatCurrency(record.price)}</Text>
                  <Text
                    className={styles.deleteBtn}
                    onClick={() => handleDeleteFilm(record.id)}
                  >
                    删除
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

      <View className={styles.bottomTip}>
        <Text className={styles.tipText}>提示：添加胶片后会自动更新账单金额并记录操作日志</Text>
      </View>
    </ScrollView>
  )
}

export default FilmRegisterPage
