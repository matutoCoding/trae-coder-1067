import React from 'react'
import { View, Text } from '@tarojs/components'
import styles from './index.module.scss'
import classnames from 'classnames'
import type { Station } from '@/types'
import { getStationTypeLabel, getStationStatusLabel } from '@/data/mockStations'

interface StationCardProps {
  station: Station
  onClick?: () => void
}

const StationCard: React.FC<StationCardProps> = ({ station, onClick }) => {
  return (
    <View className={styles.stationCard} onClick={onClick}>
      <View className={styles.cardHeader}>
        <Text className={styles.stationName}>{station.name}</Text>
        <Text className={styles.stationType}>{getStationTypeLabel(station.type)}</Text>
      </View>

      <View className={styles.cardBody}>
        <Text className={styles.description}>{station.description}</Text>

        <View className={styles.equipmentList}>
          {station.equipment.slice(0, 4).map((item, index) => (
            <Text key={index} className={styles.equipmentTag}>{item}</Text>
          ))}
          {station.equipment.length > 4 && (
            <Text className={styles.equipmentTag}>+{station.equipment.length - 4}</Text>
          )}
        </View>

        <View className={styles.stationMeta}>
          <View className={styles.priceInfo}>
            <Text className={styles.priceLabel}>基础单价</Text>
            <View>
              <Text className={styles.priceValue}>¥{station.hourlyRate}</Text>
              <Text className={styles.priceUnit}>/小时</Text>
            </View>
          </View>

          <Text className={classnames(styles.statusBadge, styles[station.status])}>
            {getStationStatusLabel(station.status)}
          </Text>
        </View>
      </View>
    </View>
  )
}

export default StationCard
