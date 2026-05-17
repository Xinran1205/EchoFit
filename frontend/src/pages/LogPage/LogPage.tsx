import { useEffect, useState } from 'react'
import dayjs from 'dayjs'
import { Button, DotLoading, Toast } from 'antd-mobile'
import { useNavigate } from 'react-router-dom'
import { AppCard } from '../../components/app/AppCard'
import { AppPage } from '../../components/app/AppPage'
import { PageHeader } from '../../components/app/PageHeader'
import { MonthTrainingCalendar } from '../../components/calendar/MonthTrainingCalendar'
import { TrainingRecordCard } from '../../components/training/TrainingRecordCard'
import { getMonthRecords } from '../../features/training/training.api'
import type { TrainingRecord } from '../../features/training/training.types'
import { getErrorMessage } from '../../lib/api'
import { formatDisplayDate, formatWeekday, toDateKey, toMonthKey } from '../../utils/date'

export function LogPage() {
  const navigate = useNavigate()
  const today = dayjs().startOf('day')
  const [month, setMonth] = useState(today.startOf('month'))
  const [selectedDate, setSelectedDate] = useState(toDateKey(today))
  const [monthRecords, setMonthRecords] = useState<TrainingRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    let active = true

    async function loadMonthRecords() {
      setLoading(true)
      setErrorMessage('')

      try {
        const response = await getMonthRecords(toMonthKey(month))
        if (!active) {
          return
        }
        setMonthRecords(response.records)
      } catch (error) {
        if (!active) {
          return
        }
        const message = getErrorMessage(error, '日志数据加载失败')
        setErrorMessage(message)
        Toast.show({ content: message })
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    void loadMonthRecords()

    return () => {
      active = false
    }
  }, [month])

  const recordedDates = new Set(monthRecords.map((record) => record.date))
  const selectedRecord = monthRecords.find((record) => record.date === selectedDate)
  const isFutureSelectedDate = dayjs(selectedDate).isAfter(today, 'day')

  return (
    <AppPage>
      <PageHeader title="日志" subtitle="像翻训练日历一样回看、补记和修改。" />

      <section className="app-section">
        <AppCard className="calendar-shell">
          <MonthTrainingCalendar
            month={month}
            selectedDate={selectedDate}
            recordedDates={recordedDates}
            onSelect={setSelectedDate}
            onChangeMonth={(nextMonth) => {
              setMonth(nextMonth)
              setSelectedDate(
                nextMonth.isSame(today, 'month')
                  ? toDateKey(today)
                  : nextMonth.startOf('month').format('YYYY-MM-DD')
              )
            }}
          />
        </AppCard>
      </section>

      <section className="app-section">
        {loading ? (
          <AppCard className="status-card">
            <DotLoading color="primary" />
            <div className="status-card__text">正在加载当月记录...</div>
          </AppCard>
        ) : errorMessage ? (
          <AppCard className="status-card">
            <div className="status-card__text">{errorMessage}</div>
          </AppCard>
        ) : selectedRecord ? (
          <TrainingRecordCard
            record={selectedRecord}
            actionText="修改这天记录"
            onAction={() =>
              navigate(`/record/edit/${selectedRecord.id}`, {
                state: { record: selectedRecord }
              })
            }
          />
        ) : (
          <AppCard>
            <div className="card-title">
              {formatDisplayDate(selectedDate)} {formatWeekday(selectedDate)}
            </div>
            <div className="app-muted" style={{ marginTop: '10px', lineHeight: '1.7' }}>
              {isFutureSelectedDate
                ? '未来日期不能补记训练。'
                : '这一天还没有训练记录。保持空白也可以，想补记的时候再回来。'}
            </div>
            <Button
              block
              color="primary"
              fill="outline"
              className="app-secondary-button"
              disabled={isFutureSelectedDate}
              style={{ marginTop: '18px' }}
              onClick={() => navigate(`/record/new?date=${selectedDate}&source=log`)}
            >
              {isFutureSelectedDate ? '这一天还不能记录' : '补记这天训练'}
            </Button>
          </AppCard>
        )}
      </section>
    </AppPage>
  )
}
