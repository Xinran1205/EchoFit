import { useEffect, useState } from 'react'
import dayjs from 'dayjs'
import { DotLoading, TextArea, Toast } from 'antd-mobile'
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { AppCard } from '../../components/app/AppCard'
import { AppPage } from '../../components/app/AppPage'
import { BottomSubmitBar } from '../../components/app/BottomSubmitBar'
import { PageHeader } from '../../components/app/PageHeader'
import { DurationPickerField } from '../../components/training/DurationPickerField'
import { TrainingPartSelector } from '../../components/training/TrainingPartSelector'
import { TrainingStatusSelector } from '../../components/training/TrainingStatusSelector'
import { WeightPickerField } from '../../components/training/WeightPickerField'
import {
  createTrainingRecord,
  getLatestWeight,
  getTrainingRecordById,
  updateTrainingRecord
} from '../../features/training/training.api'
import type {
  TrainingMood,
  TrainingPart,
  TrainingRecord
} from '../../features/training/training.types'
import { getErrorMessage } from '../../lib/api'
import { formatDisplayDate, formatWeekday } from '../../utils/date'

type RecordPageLocationState = {
  record?: TrainingRecord
}

export function RecordPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { recordId } = useParams()
  const [searchParams] = useSearchParams()
  const locationState = location.state as RecordPageLocationState | null
  const source = searchParams.get('source') ?? 'home'
  const isEditing = Boolean(recordId)
  const [existingRecord, setExistingRecord] = useState<TrainingRecord | null>(
    locationState?.record ?? null
  )
  const [loadingRecord, setLoadingRecord] = useState(isEditing && !locationState?.record)

  const today = dayjs().startOf('day')
  const todayKey = today.format('YYYY-MM-DD')
  const initialRecordDate = existingRecord?.date ?? searchParams.get('date') ?? todayKey
  const normalizedRecordDate = dayjs(initialRecordDate).isValid()
    ? dayjs(initialRecordDate).format('YYYY-MM-DD')
    : todayKey
  const requestedFutureDate = !isEditing && dayjs(normalizedRecordDate).isAfter(today, 'day')
  const recordDate = requestedFutureDate ? todayKey : normalizedRecordDate

  const [parts, setParts] = useState<TrainingPart[]>(existingRecord?.parts ?? [])
  const [durationMinutes, setDurationMinutes] = useState<number | undefined>(
    existingRecord?.durationMinutes ?? 60
  )
  const [mood, setMood] = useState<TrainingMood | undefined>(existingRecord?.mood)
  const [weightKg, setWeightKg] = useState<number | undefined>(
    existingRecord?.weightKg ?? undefined
  )
  const [note, setNote] = useState(existingRecord?.note ?? '')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!requestedFutureDate) {
      return
    }

    Toast.show({ content: '不能补记未来日期' })
    navigate(`/record/new?date=${todayKey}&source=${source}`, { replace: true })
  }, [navigate, requestedFutureDate, source, todayKey])

  useEffect(() => {
    if (!existingRecord) {
      return
    }

    setParts(existingRecord.parts)
    setDurationMinutes(existingRecord.durationMinutes)
    setMood(existingRecord.mood)
    setWeightKg(existingRecord.weightKg ?? undefined)
    setNote(existingRecord.note ?? '')
  }, [existingRecord])

  useEffect(() => {
    if (!isEditing || !recordId || existingRecord) {
      return
    }

    const targetRecordId = recordId
    let active = true

    async function loadRecord() {
      setLoadingRecord(true)

      try {
        const record = await getTrainingRecordById(targetRecordId)
        if (!active) {
          return
        }
        setExistingRecord(record)
      } catch (error) {
        if (!active) {
          return
        }
        Toast.show({ content: getErrorMessage(error, '记录加载失败') })
        navigate('/log', { replace: true })
      } finally {
        if (active) {
          setLoadingRecord(false)
        }
      }
    }

    void loadRecord()

    return () => {
      active = false
    }
  }, [existingRecord, isEditing, navigate, recordId])

  useEffect(() => {
    if (isEditing || weightKg !== undefined) {
      return
    }

    let active = true

    async function loadLatestWeight() {
      try {
        const response = await getLatestWeight()
        if (!active) {
          return
        }

        if (response.weightKg !== null) {
          setWeightKg(response.weightKg)
        }
      } catch {
        // Latest weight is optional. Keep the form usable when it cannot be loaded.
      }
    }

    void loadLatestWeight()

    return () => {
      active = false
    }
  }, [isEditing, weightKg])

  async function handleSave() {
    if (parts.length === 0) {
      Toast.show({ content: '请选择训练部位' })
      return
    }

    if (!durationMinutes) {
      Toast.show({ content: '请选择训练时长' })
      return
    }

    if (!mood) {
      Toast.show({ content: '请选择今日状态' })
      return
    }

    setSaving(true)

    try {
      if (isEditing && recordId) {
        await updateTrainingRecord(recordId, {
          parts,
          durationMinutes,
          mood,
          note: note.trim() || undefined,
          weightKg: weightKg ?? undefined
        })

        Toast.show({ content: '记录已更新' })
        navigate('/log', { replace: true })
        return
      }

      const created = await createTrainingRecord({
        date: recordDate,
        parts,
        durationMinutes,
        mood,
        note: note.trim() || undefined,
        weightKg: weightKg ?? undefined
      })

      navigate(`/echo/${created.recordId}?source=${source}`, { replace: true })
    } catch (error) {
      Toast.show({
        content: getErrorMessage(error, isEditing ? '记录保存失败' : '记录创建失败')
      })
    } finally {
      setSaving(false)
    }
  }

  if (loadingRecord) {
    return (
      <AppPage>
        <PageHeader title="加载记录" subtitle="正在读取这条训练记录..." />
        <section className="app-section">
          <AppCard className="status-card">
            <DotLoading color="primary" />
            <div className="status-card__text">正在读取训练记录...</div>
          </AppCard>
        </section>
      </AppPage>
    )
  }

  return (
    <AppPage className="app-page--with-bottom-bar">
      <PageHeader
        title={isEditing ? '修改记录' : '记录训练'}
        subtitle={`${formatDisplayDate(recordDate)} ${formatWeekday(recordDate)}`}
      />

      {!isEditing ? (
        <section className="app-section">
          <AppCard className="record-date-card">
            <div className="readonly-row">
              <span className="field-label">训练日期</span>
              <span className="readonly-row__value">
                {formatDisplayDate(recordDate)} {formatWeekday(recordDate)}
              </span>
            </div>
          </AppCard>
        </section>
      ) : null}

      <section className="app-section">
        <AppCard className="record-section-card">
          <div className="card-title">今天练了什么？</div>
          <div className="record-helper">选几个最能概括今天训练内容的部位。</div>
          <TrainingPartSelector value={parts} onChange={setParts} />
        </AppCard>
      </section>

      <section className="app-section">
        <AppCard className="record-section-card">
          <DurationPickerField value={durationMinutes} onChange={setDurationMinutes} />
        </AppCard>
      </section>

      <section className="app-section">
        <AppCard className="record-section-card">
          <div className="card-title">今日状态</div>
          <div className="record-helper">用一个最贴近体感的状态收住这次训练。</div>
          <TrainingStatusSelector value={mood} onChange={setMood} />
        </AppCard>
      </section>

      <section className="app-section">
        <AppCard className="record-section-card">
          <WeightPickerField value={weightKg} onChange={setWeightKg} />
        </AppCard>
      </section>

      <section className="app-section">
        <AppCard className="record-section-card">
          <div className="card-title">备注</div>
          <div className="record-helper">只留下一句对今天有用的补充就够了。</div>
          <TextArea
            rows={4}
            maxLength={100}
            placeholder="今天卧推动作感觉不错。"
            value={note}
            onChange={setNote}
            style={{ marginTop: '12px' }}
          />
        </AppCard>
      </section>

      <BottomSubmitBar
        text={isEditing ? '保存修改' : '保存记录'}
        loading={saving}
        onClick={handleSave}
      />
    </AppPage>
  )
}
