import React, { useState, useMemo } from 'react'
import { View, Text, ScrollView, Button, Input, Textarea } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import styles from './index.module.scss'
import classnames from 'classnames'
import dayjs from 'dayjs'
import { useBillsStore } from '@/store/useBillsStore'
import type { BillStatus } from '@/types'
import { MEMBER_LEVELS } from '@/types'
import { formatCurrency, formatDuration } from '@/utils/pricing'
import { getOperationLabel, getBillStatusLabel, getBillStatusColor } from '@/data/mockBills'
import TierBreakdown from '@/components/TierBreakdown'

const STATUS_CONFIG: Record<BillStatus, { label: string; className: string }> = {
  unpaid: { label: '待支付', className: styles.unpaid },
  paid: { label: '已支付', className: styles.paid },
  refunded: { label: '已退款', className: styles.refunded },
  cancelled: { label: '已取消', className: styles.cancelled }
}

const BillDetailPage: React.FC = () => {
  const router = useRouter()
  const billId = router.params.id as string
  const billNo = router.params.billNo as string
  const billRef = billId || billNo || ''

  const findBill = useBillsStore(state => state.findBill)
  const payBill = useBillsStore(state => state.payBill)
  const refundBill = useBillsStore(state => state.refundBill)
  const cancelBill = useBillsStore(state => state.cancelBill)
  const recalculateBill = useBillsStore(state => state.recalculateBill)

  const [showRefundModal, setShowRefundModal] = useState(false)
  const [showPayModal, setShowPayModal] = useState(false)
  const [refundAmount, setRefundAmount] = useState('')
  const [payAmount, setPayAmount] = useState('')
  const [operationNotes, setOperationNotes] = useState('')

  const bill = useMemo(() => {
    if (!billRef) return null
    return findBill(billRef) || null
  }, [billRef, findBill])

  const maxRefundable = useMemo(() => {
    if (!bill) return 0
    return Math.max(0, (bill.paidAmount || 0) - (bill.refundAmount || 0))
  }, [bill])

  const actualPaid = useMemo(() => {
    if (!bill) return 0
    return Math.max(0, (bill.paidAmount || 0) - (bill.refundAmount || 0))
  }, [bill])

  const handlePay = () => {
    if (!bill) return
    const amount = payAmount ? parseFloat(payAmount) : bill.total
    if (amount <= 0) {
      Taro.showToast({ title: '金额无效', icon: 'none' })
      return
    }
    const customNotes = operationNotes.trim() ||
      (amount === bill.total
        ? `全额收款 ¥${amount}`
        : `部分收款 ¥${amount}（应收 ¥${bill.total}，优惠挂账 ¥${Math.max(0, bill.total - amount)}）`)
    const success = payBill(bill.id, amount, customNotes)
    if (success) {
      Taro.showToast({ title: '收款成功', icon: 'success' })
      setShowPayModal(false)
      setPayAmount('')
      setOperationNotes('')
    } else {
      Taro.showToast({ title: '收款失败', icon: 'none' })
    }
  }

  const handleRefund = (isFull: boolean) => {
    if (!bill) return
    const amount = isFull
      ? maxRefundable
      : parseFloat(refundAmount) || 0

    if (amount <= 0) {
      Taro.showToast({ title: '退款金额无效', icon: 'none' })
      return
    }
    if (amount > maxRefundable) {
      Taro.showToast({ title: `最多只能退 ¥${maxRefundable.toFixed(2)}`, icon: 'none' })
      return
    }

    const success = refundBill(bill.id, amount, isFull, operationNotes.trim() || undefined)
    if (success) {
      Taro.showToast({ title: isFull ? '全额退款成功' : '部分退款成功', icon: 'success' })
      setShowRefundModal(false)
      setRefundAmount('')
      setOperationNotes('')
    } else {
      Taro.showToast({ title: '退款失败', icon: 'none' })
    }
  }

  const handleCancel = () => {
    if (!bill) return
    const isPaid = bill.status === 'paid' || bill.status === 'refunded'
    const content = isPaid
      ? (maxRefundable > 0
        ? `取消后将退还余款 ¥${maxRefundable.toFixed(2)} 并释放工位，是否继续？`
        : '账单已全额退款，取消将标记为已取消并释放工位')
      : '取消后将释放工位占用，该账单不会产生任何收款，是否继续？'

    Taro.showModal({
      title: '确认取消',
      content,
      confirmColor: '#F5222D',
      success: (res) => {
        if (res.confirm) {
          const success = cancelBill(bill.id, operationNotes.trim() || undefined)
          if (success) {
            Taro.showToast({ title: '已取消', icon: 'success' })
          } else {
            Taro.showToast({ title: '取消失败', icon: 'none' })
          }
        }
      }
    })
  }

  const handleRecalculate = () => {
    if (!bill) return
    const success = recalculateBill(bill.id)
    if (success) {
      Taro.showToast({ title: '已重新计价', icon: 'success' })
    }
  }

  const handleAddFilm = () => {
    if (!bill) return
    const param = bill.billNo ? `billNo=${encodeURIComponent(bill.billNo)}` : `id=${bill.id}`
    Taro.navigateTo({
      url: `/pages/film-register/index?${param}`
    })
  }

  const getMemberLevelLabel = (level?: string) => {
    if (!level) return ''
    return MEMBER_LEVELS[level as keyof typeof MEMBER_LEVELS]?.label || level
  }

  const getMemberLevelColor = (level?: string) => {
    if (!level) return '#7A7A9D'
    return MEMBER_LEVELS[level as keyof typeof MEMBER_LEVELS]?.color || '#7A7A9D'
  }

  if (!bill) {
    return (
      <View className={styles.emptyState}>
        <Text className={styles.emptyIcon}>📄</Text>
        <Text className={styles.emptyText}>找不到对应的账单</Text>
        <Text className={styles.emptyHint}>请检查账单号 {billRef} 是否正确</Text>
        <Button className={styles.backBtn} onClick={() => Taro.navigateBack()}>返回列表</Button>
      </View>
    )
  }

  const status = STATUS_CONFIG[bill.status]
  const hasAnyRefund = (bill.refundAmount || 0) > 0
  const showRefundInfo = (bill.status === 'paid' || bill.status === 'refunded') && hasAnyRefund
  const showPaidInfo = bill.status === 'paid' || bill.status === 'refunded' || bill.status === 'cancelled'

  return (
    <ScrollView className={styles.pageContainer} scrollY>
      <View className={styles.pageHeader}>
        <View className={styles.headerRow}>
          <View>
            <Text className={styles.headerTitle}>账单详情</Text>
            <Text className={styles.billNo}>单号：{bill.billNo}</Text>
          </View>
          <View
            className={classnames(styles.statusBadge, status.className)}
            style={{ borderColor: getBillStatusColor(bill.status), color: getBillStatusColor(bill.status) }}
          >
            <Text className={styles.statusText}>{status.label}</Text>
          </View>
        </View>
      </View>

      <View className={styles.section}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>基本信息</Text>
        </View>
        <View className={styles.infoCard}>
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>摄影师</Text>
            <View className={styles.infoValue}>
              <Text className={styles.photographerName}>{bill.photographerName}</Text>
              {bill.photographerLevel && (
                <View
                  className={styles.levelBadge}
                  style={{ background: getMemberLevelColor(bill.photographerLevel) }}
                >
                  <Text className={styles.levelText}>{getMemberLevelLabel(bill.photographerLevel)}</Text>
                </View>
              )}
            </View>
          </View>
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>使用工位</Text>
            <Text className={styles.infoText}>{bill.stationName || '-'}</Text>
          </View>
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>使用日期</Text>
            <Text className={styles.infoText}>{dayjs(bill.date).format('YYYY年MM月DD日')}</Text>
          </View>
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>使用时长</Text>
            <Text className={styles.infoText}>{formatDuration(bill.totalHours)}</Text>
          </View>
          {bill.createdAt && (
            <View className={styles.infoRow}>
              <Text className={styles.infoLabel}>创建时间</Text>
              <Text className={styles.infoText}>{dayjs(bill.createdAt).format('YYYY-MM-DD HH:mm')}</Text>
            </View>
          )}
          {bill.paidAt && (
            <View className={styles.infoRow}>
              <Text className={styles.infoLabel}>首次收款时间</Text>
              <Text className={styles.infoText}>{dayjs(bill.paidAt).format('YYYY-MM-DD HH:mm')}</Text>
            </View>
          )}
          {showPaidInfo && (bill.paidAmount || 0) > 0 && (
            <View className={styles.infoRow}>
              <Text className={styles.infoLabel}>累计实收</Text>
              <Text className={classnames(styles.infoText, styles.strong)}>
                ¥{actualPaid.toFixed(2)}
              </Text>
            </View>
          )}
          {bill.notes && (
            <View className={styles.infoRow}>
              <Text className={styles.infoLabel}>备注</Text>
              <Text className={styles.infoText}>{bill.notes}</Text>
            </View>
          )}
        </View>
      </View>

      <View className={styles.section}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>费用明细</Text>
          {bill.status !== 'cancelled' && bill.status !== 'refunded' && (
            <Text className={styles.sectionAction} onClick={handleRecalculate}>重新计价</Text>
          )}
        </View>
        <View className={styles.feeCard}>
          <TierBreakdown
            totalHours={bill.totalHours}
            tierBreakdown={bill.tierBreakdown}
            stationHourlyRate={80}
          />

          <View className={styles.feeDivider} />

          <View className={styles.feeRow}>
            <Text className={styles.feeLabel}>原价合计</Text>
            <Text className={styles.feeValue}>{formatCurrency(bill.originalTotal)}</Text>
          </View>
          <View className={styles.feeRow}>
            <Text className={styles.feeLabel}>工位使用费</Text>
            <Text className={styles.feeValue}>{formatCurrency(bill.stationFee)}</Text>
          </View>
          {bill.memberDiscountAmount > 0 && (
            <View className={classnames(styles.feeRow, styles.discountRow)}>
              <Text className={styles.feeLabel}>
                会员优惠{bill.photographerLevel ? ` (${getMemberLevelLabel(bill.photographerLevel)})` : ''}
              </Text>
              <Text className={styles.discountValue}>-{formatCurrency(bill.memberDiscountAmount)}</Text>
            </View>
          )}
          {bill.discountAmount > 0 && (
            <View className={classnames(styles.feeRow, styles.discountRow)}>
              <Text className={styles.feeLabel}>额外折扣 ({Math.round(bill.discountRate * 100)}%)</Text>
              <Text className={styles.discountValue}>-{formatCurrency(bill.discountAmount)}</Text>
            </View>
          )}
          <View className={styles.feeRow}>
            <Text className={styles.feeLabel}>胶片冲扫费</Text>
            <Text className={styles.feeValue}>{formatCurrency(bill.filmFee)}</Text>
          </View>
          <View className={styles.feeDivider} />
          <View className={classnames(styles.feeRow, styles.totalRow)}>
            <Text className={styles.totalLabel}>应收金额</Text>
            <Text className={styles.totalValue}>{formatCurrency(bill.total)}</Text>
          </View>
          {showPaidInfo && (bill.paidAmount || 0) > 0 && (
            <View className={classnames(styles.feeRow, styles.paidRow)}>
              <Text className={styles.feeLabel}>已收款</Text>
              <Text className={styles.paidValue}>-{formatCurrency(bill.paidAmount || 0)}</Text>
            </View>
          )}
          {showRefundInfo && (
            <View className={classnames(styles.feeRow, styles.refundRow)}>
              <Text className={styles.feeLabel}>已退款</Text>
              <Text className={styles.refundValue}>+{formatCurrency(bill.refundAmount || 0)}</Text>
            </View>
          )}
          {(showPaidInfo && (bill.paidAmount || 0) > 0) && (
            <View className={classnames(styles.feeRow, styles.remainingRow)}>
              <Text className={styles.totalLabel}>
                {bill.status === 'unpaid' ? '剩余应收' : bill.status === 'cancelled' ? '累计实收' : '实际结算'}
              </Text>
              <Text className={styles.remainingValue}>
                {formatCurrency(bill.status === 'unpaid'
                  ? Math.max(0, bill.total - (bill.paidAmount || 0))
                  : actualPaid)}
              </Text>
            </View>
          )}
          {(bill.status === 'paid' || bill.status === 'refunded') && maxRefundable > 0 && (
            <View className={classnames(styles.feeRow, styles.remainingRow)}>
              <Text className={styles.totalLabel}>剩余可退</Text>
              <Text className={styles.remainingValue}>{formatCurrency(maxRefundable)}</Text>
            </View>
          )}
        </View>
      </View>

      <View className={styles.section}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>胶片记录 ({bill.filmRecords.length})</Text>
          {bill.status !== 'cancelled' && bill.status !== 'refunded' && (
            <Text className={styles.sectionAction} onClick={handleAddFilm}>+ 添加</Text>
          )}
        </View>
        {bill.filmRecords.length === 0 ? (
          <View className={styles.emptyFilm}>
            <Text className={styles.emptyFilmText}>暂无胶片记录</Text>
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
                <Text className={styles.filmPrice}>{formatCurrency(record.price)}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      <View className={styles.section}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>操作记录</Text>
        </View>
        <View className={styles.timeline}>
          {bill.operationLogs.map((log, index) => (
            <View key={log.id} className={styles.timelineItem}>
              <View className={styles.timelineDot} />
              {index < bill.operationLogs.length - 1 && <View className={styles.timelineLine} />}
              <View className={styles.timelineContent}>
                <View className={styles.timelineHeader}>
                  <Text className={styles.operationType}>{getOperationLabel(log.operation)}</Text>
                  <Text className={styles.operationTime}>
                    {dayjs(log.createdAt).format('MM-DD HH:mm')}
                  </Text>
                </View>

                {log.operation === 'create' && (
                  <>
                    <Text className={classnames(styles.amountChange, styles.positive)}>
                      应收 +{formatCurrency(log.amount)}
                    </Text>
                    <Text className={styles.balanceAfter}>应收余额：{formatCurrency(log.balance)}</Text>
                  </>
                )}

                {log.operation === 'pay' && (
                  <>
                    <Text className={classnames(styles.amountChange, styles.negative)}>
                      收款 -{formatCurrency(log.amount)}（应收减少）
                    </Text>
                    <Text className={styles.statsLine}>
                      累计实收 {formatCurrency(log.paidAmount)} · 已退 {formatCurrency(log.refundAmount)}
                    </Text>
                    <Text className={styles.balanceAfter}>应收余额：{formatCurrency(log.balance)}</Text>
                  </>
                )}

                {(log.operation === 'partial_refund' || log.operation === 'full_refund') && (
                  <>
                    <Text className={classnames(styles.amountChange, styles.refundTxt)}>
                      退款 +{formatCurrency(log.amount)}（退还给客户）
                    </Text>
                    <Text className={styles.statsLine}>
                      累计实收 {formatCurrency(log.paidAmount)} · 已退 {formatCurrency(log.refundAmount)}
                    </Text>
                    <Text className={styles.balanceAfter}>
                      剩余可退：{formatCurrency(log.balance)} · 实际净收入：{formatCurrency(log.paidAmount - log.refundAmount)}
                    </Text>
                  </>
                )}

                {log.operation === 'cancel' && (
                  <>
                    {log.previousStatus === 'unpaid' ? (
                      <Text className={classnames(styles.amountChange, styles.neutral)}>
                        未产生任何收支
                      </Text>
                    ) : (
                      <>
                        <Text className={classnames(styles.amountChange, styles.refundTxt)}>
                          退还余款 +{formatCurrency(log.amount)}
                        </Text>
                        <Text className={styles.statsLine}>
                          累计实收 {formatCurrency(log.paidAmount)} · 已退 {formatCurrency(log.refundAmount)}
                        </Text>
                        <Text className={styles.balanceAfter}>
                          最终实际净收入：{formatCurrency(log.paidAmount - log.refundAmount)}
                        </Text>
                      </>
                    )}
                  </>
                )}

                {log.operation === 'recalculate' && (
                  <>
                    <Text className={classnames(
                      styles.amountChange,
                      log.changeAmount > 0 ? styles.positive : log.changeAmount < 0 ? styles.negative : styles.neutral
                    )}>
                      应收金额 {log.changeAmount >= 0 ? '+' : ''}{formatCurrency(log.changeAmount)}
                    </Text>
                    <Text className={styles.balanceAfter}>应收余额：{formatCurrency(log.balance)}</Text>
                  </>
                )}

                {(log.operation === 'film_add' || log.operation === 'film_remove') && (
                  <>
                    <Text className={classnames(
                      styles.amountChange,
                      log.changeAmount >= 0 ? styles.positive : styles.negative
                    )}>
                      应收 {log.changeAmount >= 0 ? '+' : ''}{formatCurrency(log.changeAmount)}
                    </Text>
                    {log.paidAmount > 0 && (
                      <Text className={styles.statsLine}>
                        实收 {formatCurrency(log.paidAmount)} · 已退 {formatCurrency(log.refundAmount)}
                      </Text>
                    )}
                    <Text className={styles.balanceAfter}>
                      {log.paidAmount > 0 ? '剩余可退' : '应收余额'}：{formatCurrency(log.balance)}
                    </Text>
                  </>
                )}

                {log.previousStatus !== log.newStatus && (
                  <Text className={styles.statusChange}>
                    状态变更：{getBillStatusLabel(log.previousStatus)} → {getBillStatusLabel(log.newStatus)}
                  </Text>
                )}
                {log.notes && (
                  <Text className={styles.operationNotes}>"{log.notes}"</Text>
                )}
                <Text className={styles.operator}>操作人：{log.operator}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      <View className={styles.bottomActions}>
        {bill.status === 'unpaid' && (
          <>
            <Button className={styles.btnPrimary} onClick={() => setShowPayModal(true)}>
              确认收款
            </Button>
            <Button className={styles.btnDanger} onClick={handleCancel}>
              取消订单
            </Button>
          </>
        )}
        {bill.status === 'paid' && (
          <>
            <Button className={styles.btnRefund} onClick={() => setShowRefundModal(true)}>
              申请退款
            </Button>
            <Button className={styles.btnDanger} onClick={handleCancel}>
              取消并退余款
            </Button>
          </>
        )}
        {bill.status === 'refunded' && maxRefundable > 0 && (
          <>
            <Button className={styles.btnRefund} onClick={() => setShowRefundModal(true)}>
              继续退款 ({formatCurrency(maxRefundable)})
            </Button>
            <Button className={styles.btnDanger} onClick={handleCancel}>
              取消退余款
            </Button>
          </>
        )}
      </View>

      {showPayModal && (
        <View className={styles.modalOverlay} onClick={() => setShowPayModal(false)}>
          <View className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <Text className={styles.modalTitle}>确认收款</Text>
            <View className={styles.modalBody}>
              <View className={styles.formItem}>
                <Text className={styles.formLabel}>应收金额</Text>
                <Text className={styles.formValue}>{formatCurrency(bill.total)}</Text>
              </View>
              <View className={styles.formItem}>
                <Text className={styles.formLabel}>实收金额</Text>
                <Input
                  className={styles.formInput}
                  type='digit'
                  placeholder={`输入金额（默认全额 ${formatCurrency(bill.total)}）`}
                  value={payAmount}
                  onInput={e => setPayAmount(e.detail.value)}
                />
                {payAmount && parseFloat(payAmount) !== bill.total && (
                  <Text className={styles.hintText}>
                    应收 ¥{bill.total}，实收 ¥{parseFloat(payAmount) || 0}
                    {parseFloat(payAmount) < bill.total && `，将挂账 ¥${(bill.total - parseFloat(payAmount)).toFixed(2)}`}
                  </Text>
                )}
              </View>
              <View className={styles.formItem}>
                <Text className={styles.formLabel}>备注</Text>
                <Textarea
                  className={styles.formTextarea}
                  placeholder='可选，输入收款备注'
                  value={operationNotes}
                  onInput={e => setOperationNotes(e.detail.value)}
                />
              </View>
            </View>
            <View className={styles.modalActions}>
              <Button className={styles.btnCancel} onClick={() => setShowPayModal(false)}>取消</Button>
              <Button className={styles.btnConfirm} onClick={handlePay}>确认收款</Button>
            </View>
          </View>
        </View>
      )}

      {showRefundModal && (
        <View className={styles.modalOverlay} onClick={() => setShowRefundModal(false)}>
          <View className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <Text className={styles.modalTitle}>申请退款</Text>
            <View className={styles.modalBody}>
              <View className={styles.formItem}>
                <Text className={styles.formLabel}>剩余可退</Text>
                <Text className={styles.formValue}>{formatCurrency(maxRefundable)}</Text>
              </View>
              {hasAnyRefund && (
                <View className={styles.formItem}>
                  <Text className={styles.formLabel}>已退金额</Text>
                  <Text className={styles.formRefundValue}>{formatCurrency(bill.refundAmount || 0)}</Text>
                </View>
              )}
              <View className={styles.formItem}>
                <Text className={styles.formLabel}>本次退款</Text>
                <Input
                  className={styles.formInput}
                  type='digit'
                  placeholder={`输入金额（最多 ${formatCurrency(maxRefundable)}）`}
                  value={refundAmount}
                  onInput={e => setRefundAmount(e.detail.value)}
                />
              </View>
              <View className={styles.formItem}>
                <Text className={styles.formLabel}>备注</Text>
                <Textarea
                  className={styles.formTextarea}
                  placeholder='可选，输入退款原因'
                  value={operationNotes}
                  onInput={e => setOperationNotes(e.detail.value)}
                />
              </View>
            </View>
            <View className={styles.modalActions}>
              <Button className={styles.btnCancel} onClick={() => setShowRefundModal(false)}>取消</Button>
              <Button className={styles.btnSecondary} onClick={() => handleRefund(false)}>部分退款</Button>
              <Button className={styles.btnDanger} onClick={() => handleRefund(true)}>全额退款</Button>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  )
}

export default BillDetailPage
