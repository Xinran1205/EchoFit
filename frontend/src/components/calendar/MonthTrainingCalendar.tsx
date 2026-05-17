import dayjs, { type Dayjs } from 'dayjs'
import { LeftOutline, RightOutline } from 'antd-mobile-icons'
import { buildMonthMatrix, formatMonthTitle, toDateKey } from '../../utils/date'

const weekdayLabels = ['一', '二', '三', '四', '五', '六', '日']

type MonthTrainingCalendarProps = {
  month: Dayjs
  selectedDate: string
  recordedDates: Set<string>
  onSelect: (date: string) => void
  onChangeMonth: (nextMonth: Dayjs) => void
}

export function MonthTrainingCalendar({
  month,
  selectedDate,
  recordedDates,
  onSelect,
  onChangeMonth
}: MonthTrainingCalendarProps) {
  const today = dayjs().startOf('day')
  const todayKey = toDateKey(today)
  const cells = buildMonthMatrix(month)
  const canGoNextMonth = month.isBefore(today.startOf('month'), 'month')

  return (
    <div className="calendar-card">
      <div className="calendar-header">
        <button
          type="button"
          className="icon-button pressable"
          aria-label="上个月"
          onClick={() => onChangeMonth(month.subtract(1, 'month').startOf('month'))}
        >
          <LeftOutline />
        </button>
        <strong>{formatMonthTitle(month)}</strong>
        <button
          type="button"
          className="icon-button pressable"
          aria-label="下个月"
          disabled={!canGoNextMonth}
          onClick={() => onChangeMonth(month.add(1, 'month').startOf('month'))}
        >
          <RightOutline />
        </button>
      </div>

      <div className="calendar-grid calendar-grid--weekday">
        {weekdayLabels.map((label) => (
          <div key={label} className="calendar-weekday">
            {label}
          </div>
        ))}
      </div>

      <div className="calendar-grid">
        {cells.map((item, index) => {
          if (!item) {
            return <div key={`empty-${index}`} className="calendar-cell calendar-cell--empty" />
          }

          const dateKey = toDateKey(item)
          const isSelected = dateKey === selectedDate
          const isToday = dateKey === todayKey
          const isFuture = item.isAfter(today, 'day')
          const hasRecord = recordedDates.has(dateKey)

          return (
            <button
              key={dateKey}
              type="button"
              disabled={isFuture}
              className={[
                'calendar-cell',
                isSelected ? 'calendar-cell--selected' : '',
                isToday ? 'calendar-cell--today' : '',
                isFuture ? 'calendar-cell--disabled' : ''
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={isFuture ? undefined : () => onSelect(dateKey)}
            >
              <span>{item.date()}</span>
              {hasRecord ? <span className="calendar-dot" /> : null}
            </button>
          )
        })}
      </div>
    </div>
  )
}
