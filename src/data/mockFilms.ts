import type { FilmRecord } from '@/types'

export const filmTypes = [
  { value: '柯达Tri-X 400', label: '柯达Tri-X 400', price: 35 },
  { value: '柯达T-Max 100', label: '柯达T-Max 100', price: 40 },
  { value: '柯达T-Max 400', label: '柯达T-Max 400', price: 38 },
  { value: '伊尔福HP5+', label: '伊尔福HP5+', price: 32 },
  { value: '伊尔福Delta 100', label: '伊尔福Delta 100', price: 36 },
  { value: '伊尔福Delta 400', label: '伊尔福Delta 400', price: 35 },
  { value: '富士C200', label: '富士C200', price: 25 },
  { value: '富士Provia 100F', label: '富士Provia 100F', price: 45 },
  { value: '柯达ColorPlus 200', label: '柯达ColorPlus 200', price: 28 },
  { value: '柯达Gold 200', label: '柯达Gold 200', price: 30 },
  { value: '柯达Ektar 100', label: '柯达Ektar 100', price: 50 },
  { value: '柯达Portra 160', label: '柯达Portra 160', price: 55 },
  { value: '柯达Portra 400', label: '柯达Portra 400', price: 58 },
  { value: '柯达Portra 800', label: '柯达Portra 800', price: 65 },
  { value: '富士Superia X-TRA 400', label: '富士Superia X-TRA 400', price: 32 }
]

export const processTypes = [
  { value: 'C-41', label: 'C-41 彩色负片', price: 25 },
  { value: 'E-6', label: 'E-6 彩色反转片', price: 40 },
  { value: '黑白', label: '黑白冲洗', price: 30 },
  { value: '黑白反转', label: '黑白反转', price: 50 },
  { value: '扫描', label: '仅扫描', price: 20 }
]

export const formatOptions = [
  { value: '135', label: '135 (35mm)' },
  { value: '120', label: '120 中画幅' },
  { value: '4x5', label: '4×5 大画幅' },
  { value: '8x10', label: '8×10 大画幅' }
]

export const calculateFilmPrice = (
  filmType: string,
  processType: string,
  quantity: number,
  format: string
): number => {
  const film = filmTypes.find(f => f.value === filmType)
  const process = processTypes.find(p => p.value === processType)

  const basePrice = (film?.price || 30) + (process?.price || 25)

  const formatMultiplier = format === '8x10' ? 3 : format === '4x5' ? 2 : format === '120' ? 1.5 : 1

  return Math.round(basePrice * quantity * formatMultiplier * 100) / 100
}

export const mockFilmRecords: FilmRecord[] = [
  {
    id: 'FR-001',
    filmType: '柯达ColorPlus 200',
    format: '135',
    processType: 'C-41',
    quantity: 2,
    price: 80,
    notes: '彩色负片冲洗扫描',
    createdAt: new Date().toISOString()
  }
]
