import type { Station } from '@/types'
import dayjs from 'dayjs'

export const mockStations: Station[] = [
  {
    id: 'ST-001',
    name: '黑白暗房A',
    type: 'black_white',
    description: '专业黑白胶片冲洗工位，配备放大机、安全灯、恒温冲洗设备',
    equipment: ['Durst M601放大机', 'JOBO CPE2冲洗机', '柯达安全灯', '恒温水槽'],
    capacity: 1,
    status: 'available',
    hourlyRate: 80,
    createdAt: dayjs().subtract(6, 'month').toISOString()
  },
  {
    id: 'ST-002',
    name: '黑白暗房B',
    type: 'black_white',
    description: '标准黑白冲洗工位，适合初学者和小型项目',
    equipment: ['Beseler 23C放大机', '手动冲洗罐', '安全灯', '温度计'],
    capacity: 1,
    status: 'available',
    hourlyRate: 60,
    createdAt: dayjs().subtract(5, 'month').toISOString()
  },
  {
    id: 'ST-003',
    name: '彩色暗房C',
    type: 'color',
    description: '专业彩色胶片冲洗工位，配备彩色放大机和色彩分析仪',
    equipment: ['Durst M805彩色放大机', 'JOBO CPP2彩色冲洗机', '色彩分析仪', '恒温系统'],
    capacity: 1,
    status: 'available',
    hourlyRate: 120,
    createdAt: dayjs().subtract(4, 'month').toISOString()
  },
  {
    id: 'ST-004',
    name: '大画幅暗房D',
    type: 'large_format',
    description: '4x5及以上大画幅专业工位，配备大画幅放大机',
    equipment: ['De Vere 504大画幅放大机', '大画幅冲洗盘', '恒温控制', '专业镜头组'],
    capacity: 1,
    status: 'maintenance',
    hourlyRate: 150,
    createdAt: dayjs().subtract(3, 'month').toISOString()
  },
  {
    id: 'ST-005',
    name: '黑白暗房E',
    type: 'black_white',
    description: '高级黑白暗房，适合专业摄影师和艺术创作',
    equipment: ['Leitz Focomat放大机', 'JOBO ATL1全自动冲洗机', '专业测光表', '高品质镜头'],
    capacity: 1,
    status: 'available',
    hourlyRate: 100,
    createdAt: dayjs().subtract(2, 'month').toISOString()
  }
]

export const getStationTypeLabel = (type: Station['type']): string => {
  const map: Record<Station['type'], string> = {
    black_white: '黑白暗房',
    color: '彩色暗房',
    large_format: '大画幅'
  }
  return map[type]
}

export const getStationStatusLabel = (status: Station['status']): string => {
  const map: Record<Station['status'], string> = {
    available: '正常营业',
    maintenance: '维护中',
    disabled: '已停用'
  }
  return map[status]
}

export const getStationStatusColor = (status: Station['status']): string => {
  const map: Record<Station['status'], string> = {
    available: '#00C853',
    maintenance: '#FFAB00',
    disabled: '#7A7A9D'
  }
  return map[status]
}
