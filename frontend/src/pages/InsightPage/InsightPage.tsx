import { useEffect, useMemo, useState } from 'react'
import dayjs from 'dayjs'
import { Button, DatePickerView, DotLoading, Popup, Toast } from 'antd-mobile'
import { CloseOutline, HistogramOutline, RightOutline } from 'antd-mobile-icons'
import { AppCard } from '../../components/app/AppCard'
import { AppPage } from '../../components/app/AppPage'
import { PageHeader } from '../../components/app/PageHeader'
import { getInsightEchoes, getInsightSummary } from '../../features/insight/insight.api'
import type {
  InsightEchoPageResult,
  InsightRangeInput,
  InsightRangeType,
  InsightSummary
} from '../../features/insight/insight.types'
import {
  getTrainingPartLabel,
  trainingPartOptions
} from '../../features/training/training.dictionary'
import { getErrorMessage } from '../../lib/api'
import { formatDuration } from '../../utils/date'

const RANGE_OPTIONS: Array<{ label: string; value: InsightRangeType }> = [
  { label: '本周', value: 'week' },
  { label: '本月', value: 'month' },
  { label: '自定义', value: 'custom' }
]

const ECHO_PAGE_SIZE = 10

type CustomRangeState = {
  startDate: string
  endDate: string
}

function buildPresetRange(rangeType: Exclude<InsightRangeType, 'custom'>): CustomRangeState {
  const today = dayjs().startOf('day')

  if (rangeType === 'week') {
    const weekStart = today.subtract((today.day() + 6) % 7, 'day')
    return {
      startDate: weekStart.format('YYYY-MM-DD'),
      endDate: weekStart.add(6, 'day').format('YYYY-MM-DD')
    }
  }

  return {
    startDate: today.startOf('month').format('YYYY-MM-DD'),
    endDate: today.endOf('month').format('YYYY-MM-DD')
  }
}

function formatRangeLabel(startDate: string, endDate: string) {
  const start = dayjs(startDate)
  const end = dayjs(endDate)
  const sameYear = start.year() === end.year()

  if (!sameYear) {
    return `${start.format('YYYY年M月D日')} - ${end.format('YYYY年M月D日')}`
  }

  if (start.year() !== dayjs().year()) {
    return `${start.format('YYYY年M月D日')} - ${end.format('M月D日')}`
  }

  return `${start.format('M月D日')} - ${end.format('M月D日')}`
}

function getFallbackRangeLabel(rangeType: InsightRangeType, customRange: CustomRangeState) {
  if (rangeType === 'custom') {
    return formatRangeLabel(customRange.startDate, customRange.endDate)
  }

  const presetRange = buildPresetRange(rangeType)
  return formatRangeLabel(presetRange.startDate, presetRange.endDate)
}

function toPickerDate(dateKey: string) {
  return dayjs(dateKey).toDate()
}

function toDateKey(date: Date) {
  return dayjs(date).format('YYYY-MM-DD')
}

function getRangeDayCount(startDate: string, endDate: string) {
  return dayjs(endDate).diff(dayjs(startDate), 'day') + 1
}

export function InsightPage() {
  const todayKey = dayjs().format('YYYY-MM-DD')
  const todayDate = dayjs(todayKey, 'YYYY-MM-DD').toDate()

  const [rangeType, setRangeType] = useState<InsightRangeType>('week')
  const [customRange, setCustomRange] = useState<CustomRangeState>(() => buildPresetRange('month'))
  const [summary, setSummary] = useState<InsightSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [customRangePickerOpen, setCustomRangePickerOpen] = useState(false)
  const [customRangeDraft, setCustomRangeDraft] = useState<CustomRangeState>(() =>
    buildPresetRange('week')
  )
  const [echoPopupOpen, setEchoPopupOpen] = useState(false)
  const [echoPage, setEchoPage] = useState(1)
  const [echoPageData, setEchoPageData] = useState<InsightEchoPageResult | null>(null)
  const [echoLoading, setEchoLoading] = useState(false)
  const [echoErrorMessage, setEchoErrorMessage] = useState('')

  const activeRange = useMemo<InsightRangeInput>(() => {
    if (rangeType === 'custom') {
      return {
        rangeType,
        startDate: customRange.startDate,
        endDate: customRange.endDate
      }
    }

    return { rangeType }
  }, [customRange.endDate, customRange.startDate, rangeType])

  const rangeKey =
    rangeType === 'custom'
      ? `${rangeType}:${customRange.startDate}:${customRange.endDate}`
      : rangeType

  useEffect(() => {
    let active = true

    async function loadSummary() {
      setLoading(true)
      setErrorMessage('')

      try {
        const nextSummary = await getInsightSummary(activeRange)

        if (!active) {
          return
        }

        setSummary(nextSummary)
      } catch (error) {
        if (!active) {
          return
        }

        setErrorMessage(getErrorMessage(error, '洞察数据加载失败'))
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    void loadSummary()

    return () => {
      active = false
    }
  }, [activeRange])

  useEffect(() => {
    setEchoPage(1)
    setEchoPageData(null)
  }, [rangeKey])

  useEffect(() => {
    if (!echoPopupOpen) {
      return
    }

    let active = true

    async function loadEchoes() {
      setEchoLoading(true)
      setEchoErrorMessage('')

      try {
        const nextPage = await getInsightEchoes({
          ...activeRange,
          page: echoPage,
          pageSize: ECHO_PAGE_SIZE
        })

        if (!active) {
          return
        }

        setEchoPageData(nextPage)

        if (nextPage.page !== echoPage) {
          setEchoPage(nextPage.page)
        }
      } catch (error) {
        if (!active) {
          return
        }

        setEchoErrorMessage(getErrorMessage(error, '回声摘录加载失败'))
      } finally {
        if (active) {
          setEchoLoading(false)
        }
      }
    }

    void loadEchoes()

    return () => {
      active = false
    }
  }, [activeRange, echoPage, echoPopupOpen])

  const partItems = useMemo(() => {
    const indexedOptions = new Map(
      trainingPartOptions.map((option, index) => [option.value, index] as const)
    )

    return trainingPartOptions
      .map((option) => ({
        part: option.value,
        label: getTrainingPartLabel(option.value),
        count: summary?.partCounts[option.value] ?? 0
      }))
      .filter((item) => item.count > 0)
      .sort((left, right) => {
        if (right.count !== left.count) {
          return right.count - left.count
        }

        return (
          (indexedOptions.get(left.part) ?? trainingPartOptions.length) -
          (indexedOptions.get(right.part) ?? trainingPartOptions.length)
        )
      })
  }, [summary])

  const maxPartCount = partItems[0]?.count ?? 0
  const totalEchoMessages = summary?.echoPreview.totalMessages ?? 0
  const rangeLabel = summary
    ? formatRangeLabel(summary.startDate, summary.endDate)
    : getFallbackRangeLabel(rangeType, customRange)
  const customRangeDayCount = useMemo(
    () => getRangeDayCount(customRange.startDate, customRange.endDate),
    [customRange.endDate, customRange.startDate]
  )
  const customRangeDraftDayCount = useMemo(
    () => getRangeDayCount(customRangeDraft.startDate, customRangeDraft.endDate),
    [customRangeDraft.endDate, customRangeDraft.startDate]
  )

  function openCustomRangePicker() {
    const nextDraft =
      rangeType === 'custom'
        ? customRange
        : summary
          ? {
              startDate: summary.startDate,
              endDate: summary.endDate
            }
          : buildPresetRange(rangeType)

    setCustomRangeDraft(nextDraft)
    setCustomRangePickerOpen(true)
  }

  function handleRangeSelect(nextRangeType: InsightRangeType) {
    if (nextRangeType === 'custom') {
      openCustomRangePicker()
      return
    }

    setRangeType(nextRangeType)
  }

  function handleDraftDateChange(field: 'startDate' | 'endDate', value: Date | null) {
    if (!value) {
      return
    }

    const nextDateKey = toDateKey(value)

    setCustomRangeDraft((current) => {
      if (field === 'startDate') {
        return {
          startDate: nextDateKey,
          endDate: current.endDate < nextDateKey ? nextDateKey : current.endDate
        }
      }

      return {
        startDate: current.startDate > nextDateKey ? nextDateKey : current.startDate,
        endDate: nextDateKey
      }
    })
  }

  function handleApplyCustomRange() {
    const { startDate, endDate } = customRangeDraft

    if (!startDate || !endDate) {
      Toast.show({ content: '请选择开始日期和结束日期' })
      return
    }

    if (startDate > endDate) {
      Toast.show({ content: '开始日期不能晚于结束日期' })
      return
    }

    if (endDate > todayKey) {
      Toast.show({ content: '结束日期不能晚于今天' })
      return
    }

    setCustomRange(customRangeDraft)
    setRangeType('custom')
    setCustomRangePickerOpen(false)
  }

  function renderOverview() {
    if (loading) {
      return (
        <AppCard className="status-card">
          <DotLoading color="primary" />
          <div className="status-card__text">正在整理这段训练...</div>
        </AppCard>
      )
    }

    if (errorMessage) {
      return (
        <AppCard className="status-card">
          <div className="status-card__text">{errorMessage}</div>
        </AppCard>
      )
    }

    return (
      <>
        <AppCard className="insight-card">
          <div className="insight-card__header">
            <div>
              <div className="card-title">总览</div>
              <div className="insight-card__meta">{rangeLabel}</div>
            </div>
            <div className="insight-card__badge">
              <HistogramOutline />
            </div>
          </div>

          <div className="stats-grid insight-stats-grid">
            <div className="stat-box insight-stat-box">
              <span>训练天数</span>
              <strong>{summary?.overview.trainingDays ?? 0}</strong>
            </div>
            <div className="stat-box insight-stat-box">
              <span>累计时长</span>
              <strong>{formatDuration(summary?.overview.totalDurationMinutes ?? 0)}</strong>
            </div>
          </div>
        </AppCard>

        <AppCard className="insight-card">
          <div className="insight-card__header">
            <div className="card-title">部位分布</div>
          </div>

          {partItems.length > 0 ? (
            <div className="insight-part-list">
              {partItems.map((item) => {
                const width = maxPartCount > 0 ? Math.max((item.count / maxPartCount) * 100, 16) : 0

                return (
                  <div key={item.part} className="insight-part-row">
                    <div className="insight-part-row__head">
                      <span>{item.label}</span>
                      <span>{item.count} 次</span>
                    </div>
                    <div className="insight-part-row__meter">
                      <div
                        className="insight-part-row__fill"
                        style={{ width: `${Math.min(width, 100)}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="insight-empty">这段时间还没有训练记录。</div>
          )}
        </AppCard>

        <AppCard className="insight-card insight-card--echo">
          <div className="insight-card__header">
            <div>
              <div className="card-title">回声摘录</div>
              <div className="insight-card__meta">
                {totalEchoMessages > 0
                  ? `这段时间，你留下了 ${totalEchoMessages} 句话`
                  : '这段时间，你还没有留下新的话'}
              </div>
            </div>
          </div>

          {summary?.echoPreview.excerpts.length ? (
            <div className="echo-preview-list">
              {summary.echoPreview.excerpts.map((excerpt, index) => (
                <article key={excerpt.id} className="echo-preview-item">
                  <div className="echo-preview-item__index">
                    {String(index + 1).padStart(2, '0')}
                  </div>
                  <div className="echo-preview-item__body">
                    <div className="echo-preview-item__content">{excerpt.content}</div>
                    <div className="echo-preview-item__meta">
                      {dayjs(excerpt.date).format('M月D日')}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="insight-empty">这段时间还没有回声摘录。</div>
          )}

          {totalEchoMessages > 0 ? (
            <button
              type="button"
              className="echo-preview-more pressable"
              onClick={() => {
                setEchoPage(1)
                setEchoPopupOpen(true)
              }}
            >
              <span>查看全部 {totalEchoMessages} 条</span>
              <RightOutline />
            </button>
          ) : null}
        </AppCard>
      </>
    )
  }

  return (
    <AppPage>
      <PageHeader title="洞察" />

      <section className="app-section">
        <div className="insight-range-switch">
          {RANGE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              className={[
                'insight-range-switch__item',
                option.value === rangeType ? 'insight-range-switch__item--active' : ''
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => handleRangeSelect(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>

        {rangeType === 'custom' ? (
          <button
            type="button"
            className="insight-custom-summary pressable"
            onClick={openCustomRangePicker}
          >
            <span className="insight-custom-summary__copy">
              <span className="insight-custom-summary__label">当前自定义范围</span>
              <strong>{rangeLabel}</strong>
            </span>
            <span className="insight-custom-summary__meta">共 {customRangeDayCount} 天</span>
          </button>
        ) : null}
      </section>

      <section className="app-section insight-stack">{renderOverview()}</section>

      <Popup
        visible={customRangePickerOpen}
        position="bottom"
        closeOnMaskClick
        onMaskClick={() => setCustomRangePickerOpen(false)}
        bodyStyle={{
          borderTopLeftRadius: 32,
          borderTopRightRadius: 32,
          overflow: 'hidden',
          background: 'rgba(248, 245, 239, 0.98)'
        }}
      >
        <div className="insight-sheet insight-sheet--range">
          <div className="insight-sheet__handle" />

          <div className="insight-sheet__title-row">
            <div className="card-title">自定义范围</div>
            <div className="insight-sheet__title-meta">共 {customRangeDraftDayCount} 天</div>
          </div>

          <div className="insight-picker-grid insight-picker-grid--inline">
            <section className="insight-picker-card insight-picker-card--mini">
              <div className="insight-picker-card__label">开始</div>
              <div className="insight-date-picker insight-date-picker--mini">
                <DatePickerView
                  precision="day"
                  value={toPickerDate(customRangeDraft.startDate)}
                  max={toPickerDate(customRangeDraft.endDate)}
                  onChange={(value) => handleDraftDateChange('startDate', value)}
                />
              </div>
            </section>

            <section className="insight-picker-card insight-picker-card--mini">
              <div className="insight-picker-card__label">结束</div>
              <div className="insight-date-picker insight-date-picker--mini">
                <DatePickerView
                  precision="day"
                  value={toPickerDate(customRangeDraft.endDate)}
                  min={toPickerDate(customRangeDraft.startDate)}
                  max={todayDate}
                  onChange={(value) => handleDraftDateChange('endDate', value)}
                />
              </div>
            </section>
          </div>

          <div className="insight-sheet__actions">
            <Button
              block
              fill="outline"
              color="primary"
              className="app-secondary-button"
              onClick={() => setCustomRangePickerOpen(false)}
            >
              取消
            </Button>
            <Button
              block
              color="primary"
              className="app-primary-button"
              onClick={handleApplyCustomRange}
            >
              应用范围
            </Button>
          </div>
        </div>
      </Popup>

      <Popup
        visible={echoPopupOpen}
        position="bottom"
        closeOnMaskClick
        onMaskClick={() => setEchoPopupOpen(false)}
        bodyStyle={{
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          overflow: 'hidden',
          background: 'rgba(248, 245, 239, 0.98)'
        }}
      >
        <div className="insight-sheet">
          <div className="insight-sheet__header">
            <div>
              <div className="card-title">全部回声</div>
              <div className="insight-card__meta">
                {rangeLabel} · 共 {echoPageData?.totalMessages ?? totalEchoMessages} 条
              </div>
            </div>
            <button
              type="button"
              className="icon-button pressable"
              onClick={() => setEchoPopupOpen(false)}
            >
              <CloseOutline />
            </button>
          </div>

          <div className="insight-sheet__body">
            {echoLoading ? (
              <div className="status-card insight-sheet__status">
                <DotLoading color="primary" />
                <div className="status-card__text">正在翻看这些回声...</div>
              </div>
            ) : echoErrorMessage ? (
              <div className="status-card insight-sheet__status">
                <div className="status-card__text">{echoErrorMessage}</div>
              </div>
            ) : echoPageData?.items.length ? (
              <div className="echo-sheet-list">
                {echoPageData.items.map((item) => (
                  <article key={item.id} className="echo-sheet-item">
                    <div className="echo-sheet-item__content">{item.content}</div>
                    <div className="echo-sheet-item__meta">
                      {dayjs(item.date).format('YYYY年M月D日')}
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="insight-empty insight-sheet__status">这段时间还没有可回看的回声。</div>
            )}
          </div>

          {echoPageData && echoPageData.totalPages > 1 ? (
            <div className="insight-sheet__pagination">
              <Button
                fill="outline"
                color="primary"
                className="app-secondary-button"
                disabled={echoPageData.page <= 1}
                onClick={() => setEchoPage((current) => Math.max(current - 1, 1))}
              >
                上一页
              </Button>
              <div className="insight-sheet__pagination-meta">
                第 {echoPageData.page} / {echoPageData.totalPages} 页
              </div>
              <Button
                fill="outline"
                color="primary"
                className="app-secondary-button"
                disabled={echoPageData.page >= echoPageData.totalPages}
                onClick={() =>
                  setEchoPage((current) => Math.min(current + 1, echoPageData.totalPages))
                }
              >
                下一页
              </Button>
            </div>
          ) : null}
        </div>
      </Popup>
    </AppPage>
  )
}
