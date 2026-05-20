import { useEffect, useMemo, useState } from 'react'
import dayjs, { type Dayjs } from 'dayjs'
import { Button, DotLoading, Toast } from 'antd-mobile'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { AppCard } from '../../components/app/AppCard'
import { AppPage } from '../../components/app/AppPage'
import { PageHeader } from '../../components/app/PageHeader'
import { MonthTrainingCalendar } from '../../components/calendar/MonthTrainingCalendar'
import { RestDayCard } from '../../components/training/RestDayCard'
import { TrainingRecordCard } from '../../components/training/TrainingRecordCard'
import { getMonthRecords } from '../../features/training/training.api'
import type { RestDay, TrainingRecord } from '../../features/training/training.types'
import { getErrorMessage } from '../../lib/api'
import { formatDisplayDate, formatWeekday, toDateKey, toMonthKey } from '../../utils/date'

function resolveLogSelectedDate(dateKey: string | null, today: Dayjs) {
  if (!dateKey) {
    return toDateKey(today)
  }

  const parsedDate = dayjs(dateKey).startOf('day')

  if (!parsedDate.isValid()) {
    return toDateKey(today)
  }

  return toDateKey(parsedDate.isAfter(today, 'day') ? today : parsedDate)
}

function buildRecordRoute(pathname: string, params: Record<string, string>) {
  const searchParams = new URLSearchParams(params)
  return `${pathname}?${searchParams.toString()}`
}

export function LogPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const today = dayjs().startOf('day')
  const todayKey = toDateKey(today)
  const requestedDate = searchParams.get('date')
  const initialSelectedDate = resolveLogSelectedDate(requestedDate, today)
  const [month, setMonth] = useState(() => dayjs(initialSelectedDate).startOf('month'))
  const [selectedDate, setSelectedDate] = useState(initialSelectedDate)
  const [monthRecords, setMonthRecords] = useState<TrainingRecord[]>([])
  const [monthRestDays, setMonthRestDays] = useState<RestDay[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    const nextSelectedDate = resolveLogSelectedDate(requestedDate, today)
    const nextMonth = dayjs(nextSelectedDate).startOf('month')

    setSelectedDate((current) => (current === nextSelectedDate ? current : nextSelectedDate))
    setMonth((current) => (current.isSame(nextMonth, 'month') ? current : nextMonth))
  }, [requestedDate, todayKey])

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
        setMonthRestDays(response.restDays)
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

  const recordedDates = useMemo(
    () => new Set(monthRecords.map((record) => record.date)),
    [monthRecords]
  )
  const restDates = useMemo(
    () => new Set(monthRestDays.map((restDay) => restDay.date)),
    [monthRestDays]
  )
  const selectedRecord = monthRecords.find((record) => record.date === selectedDate)
  const selectedRestDay = monthRestDays.find((restDay) => restDay.date === selectedDate)
  const isFutureSelectedDate = dayjs(selectedDate).isAfter(today, 'day')

  return (
    <AppPage>
      <PageHeader title="日志" subtitle="回看训练、休息和那些被你认真留住的片段。" />

      <section className="app-section">
        <AppCard className="calendar-shell">
          <MonthTrainingCalendar
            month={month}
            selectedDate={selectedDate}
            recordedDates={recordedDates}
            restDates={restDates}
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
              navigate(
                buildRecordRoute(`/record/edit/${selectedRecord.id}`, {
                  source: 'log',
                  logDate: selectedDate
                }),
                {
                  state: { record: selectedRecord }
                }
              )
            }
          />
        ) : selectedRestDay ? (
          <RestDayCard restDay={selectedRestDay} />
        ) : (
          <AppCard>
            <div className="card-title">
              {formatDisplayDate(selectedDate)} {formatWeekday(selectedDate)}
            </div>
            <div className="app-muted" style={{ marginTop: '10px', lineHeight: '1.7' }}>
              {isFutureSelectedDate
                ? '未来日期不能补记训练，也不能提前标记休息。'
                : '这一天还没有训练记录。留白是允许的，想补记的时候再回来也可以。'}
            </div>
            <Button
              block
              color="primary"
              fill="outline"
              className="app-secondary-button"
              disabled={isFutureSelectedDate}
              style={{ marginTop: '18px' }}
              onClick={() =>
                navigate(
                  buildRecordRoute('/record/new', {
                    date: selectedDate,
                    source: 'log',
                    logDate: selectedDate
                  })
                )
              }
            >
              {isFutureSelectedDate ? '这一天还不能记录' : '补记这天训练'}
            </Button>
          </AppCard>
        )}
      </section>
    </AppPage>
  )
}
