export const THAI_MONTHS_SHORT = [
  '', 'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
]

export const THAI_MONTHS_FULL = [
  '', 'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
]

export const THAI_DAYS_SHORT = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.']

/**
 * Returns today's date string in YYYY-MM-DD using local browser time.
 */
export function getTodayISO() {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/**
 * Returns current year and month (1-12) using local browser time.
 */
export function getCurrentYearMonth() {
  const now = new Date()
  return {
    year: now.getFullYear(),
    month: now.getMonth() + 1,
    ymString: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  }
}

/**
 * Formats YYYY-MM-DD into Thai readable string e.g. "11 พ.ย. 2569"
 */
export function formatThaiDateShort(dateStr) {
  if (!dateStr) return '-'
  const parts = String(dateStr).split('-')
  if (parts.length !== 3) return dateStr
  const y = parseInt(parts[0], 10)
  const m = parseInt(parts[1], 10)
  const d = parseInt(parts[2], 10)
  const buddhistYear = y + 543
  return `${d} ${THAI_MONTHS_SHORT[m] || m} ${buddhistYear}`
}

/**
 * Formats YYYY-MM-DD into full Thai date with weekday e.g. "วันพุธที่ 11 พ.ย. 2569"
 */
export function formatThaiDateFull(dateStr) {
  if (!dateStr) return '-'
  const parts = String(dateStr).split('-')
  if (parts.length !== 3) return dateStr
  const y = parseInt(parts[0], 10)
  const m = parseInt(parts[1], 10)
  const d = parseInt(parts[2], 10)
  const dt = new Date(y, m - 1, d)
  const dayNames = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์']
  const dayName = dayNames[dt.getDay()]
  return `วัน${dayName}ที่ ${d} ${THAI_MONTHS_SHORT[m]} ${y + 543}`
}

/**
 * Returns number of days in given (year, month 1-12)
 */
export function getDaysInMonth(year, month) {
  return new Date(year, month, 0).getDate()
}

/**
 * Returns weekday short name and weekend status for (year, month 1-12, day)
 */
export function getDayMeta(year, month, day) {
  const dt = new Date(year, month - 1, day)
  const dow = dt.getDay()
  return {
    dow,
    dayShort: THAI_DAYS_SHORT[dow],
    isSunday: dow === 0,
    isSaturday: dow === 6,
    iso: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  }
}

/**
 * Checks if current time is before 17:00 (or uses developer simulated time if set).
 * devSimTimeMode: 'real' | 'before17' | 'after17'
 */
export function getCutOffStatus(devSimTimeMode = 'real') {
  const now = new Date()
  if (devSimTimeMode === 'before17') {
    return {
      isBefore17: true,
      timeLabel: '16:15 น. (จำลองเวลา Dev < 17:00)',
      hour: 16,
      minute: 15
    }
  }
  if (devSimTimeMode === 'after17') {
    return {
      isBefore17: false,
      timeLabel: '17:35 น. (จำลองเวลา Dev > 17:00)',
      hour: 17,
      minute: 35
    }
  }
  const h = now.getHours()
  const m = now.getMinutes()
  const isBefore17 = h < 17
  return {
    isBefore17,
    timeLabel: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')} น.`,
    hour: h,
    minute: m
  }
}

/**
 * Color theme helper for task descriptions based on site keywords
 */
export function getTaskColorClasses(taskDesc) {
  if (!taskDesc) return {
    bg: 'bg-slate-50',
    border: 'border-slate-200',
    text: 'text-slate-700',
    badge: 'bg-slate-200 text-slate-700',
    cellBg: 'bg-slate-100/90 border-slate-300 text-slate-800'
  }
  if (taskDesc.includes('วันหยุด')) {
    return {
      bg: 'bg-rose-50/80',
      border: 'border-rose-200',
      text: 'text-rose-700',
      badge: 'bg-rose-100 text-rose-700',
      cellBg: 'bg-rose-100/90 border-rose-300 text-rose-900'
    }
  }
  if (taskDesc.includes('คุระบุรี')) {
    return {
      bg: 'bg-blue-50/80',
      border: 'border-blue-200',
      text: 'text-blue-900',
      badge: 'bg-blue-100 text-blue-800',
      cellBg: 'bg-blue-100/95 border-blue-300 text-blue-950'
    }
  }
  if (taskDesc.includes('เขาหลัก') || taskDesc.includes('ดีว่า') || taskDesc.includes('The Sand')) {
    return {
      bg: 'bg-emerald-50/80',
      border: 'border-emerald-200',
      text: 'text-emerald-900',
      badge: 'bg-emerald-100 text-emerald-800',
      cellBg: 'bg-emerald-100/95 border-emerald-300 text-emerald-950'
    }
  }
  if (taskDesc.includes('กะตะ') || taskDesc.includes('กะรน')) {
    return {
      bg: 'bg-amber-50/80',
      border: 'border-amber-200',
      text: 'text-amber-900',
      badge: 'bg-amber-100 text-amber-800',
      cellBg: 'bg-amber-100/95 border-amber-300 text-amber-950'
    }
  }
  if (taskDesc.includes('โรงเรือ') || taskDesc.includes('นากก') || taskDesc.includes('วัดใต้') || taskDesc.includes('ออฟฟิศ') || taskDesc.includes('โรงงาน')) {
    return {
      bg: 'bg-purple-50/80',
      border: 'border-purple-200',
      text: 'text-purple-900',
      badge: 'bg-purple-100 text-purple-800',
      cellBg: 'bg-purple-100/95 border-purple-300 text-purple-950'
    }
  }
  return {
    bg: 'bg-cyan-50/80',
    border: 'border-cyan-200',
    text: 'text-cyan-900',
    badge: 'bg-cyan-100 text-cyan-800',
    cellBg: 'bg-cyan-100/95 border-cyan-300 text-cyan-950'
  }
}
