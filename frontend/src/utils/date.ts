import dayjs, { type Dayjs } from 'dayjs'
import 'dayjs/locale/zh-cn'

dayjs.locale('zh-cn')

export function formatDisplayDate(date: string | Date | Dayjs) {
  return dayjs(date).format('M月D日')
}

export function formatWeekday(date: string | Date | Dayjs) {
  return dayjs(date).format('dddd')
}

export function formatMonthTitle(date: string | Date | Dayjs) {
  return dayjs(date).format('YYYY年M月')
}

export function toDateKey(date: string | Date | Dayjs) {
  return dayjs(date).format('YYYY-MM-DD')
}

export function toMonthKey(date: string | Date | Dayjs) {
  return dayjs(date).format('YYYY-MM')
}

export function formatDuration(minutes: number) {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60

  if (hours === 0) {
    return `${mins} 分钟`
  }

  if (mins === 0) {
    return `${hours} 小时`
  }

  return `${hours} 小时 ${mins} 分钟`
}

export function buildMonthMatrix(month: Dayjs) {
  const start = month.startOf('month')
  const offset = (start.day() + 6) % 7
  const daysInMonth = month.daysInMonth()
  const totalCells = Math.ceil((offset + daysInMonth) / 7) * 7

  return Array.from({ length: totalCells }, (_, index) => {
    const dayNumber = index - offset + 1
    if (dayNumber < 1 || dayNumber > daysInMonth) {
      return null
    }
    return month.date(dayNumber)
  })
}
