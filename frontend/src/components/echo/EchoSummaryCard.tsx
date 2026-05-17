import type { EchoRecordSummary } from '../../features/echo/echo.types'
import {
  getTrainingMoodLabel,
  getTrainingPartLabel
} from '../../features/training/training.dictionary'
import { formatDisplayDate, formatDuration } from '../../utils/date'
import { AppCard } from '../app/AppCard'

type EchoSummaryCardProps = {
  record: EchoRecordSummary
}

export function EchoSummaryCard({ record }: EchoSummaryCardProps) {
  return (
    <AppCard>
      <div className="section-kicker">训练摘要</div>
      <div className="card-title" style={{ marginTop: '8px' }}>
        这次训练已记录
      </div>
      <div className="app-muted" style={{ marginTop: '10px' }}>
        {formatDisplayDate(record.date)} · {formatDuration(record.durationMinutes)}
      </div>
      <div className="pill-list" style={{ marginTop: '16px' }}>
        {record.parts.map((part) => (
          <span key={part} className="pill pill--soft">
            {getTrainingPartLabel(part)}
          </span>
        ))}
      </div>
      <div className="detail-list" style={{ marginTop: '18px' }}>
        <div>状态：{getTrainingMoodLabel(record.mood)}</div>
        {record.weightKg !== undefined && record.weightKg !== null ? (
          <div>体重：{record.weightKg.toFixed(1)} kg</div>
        ) : null}
      </div>
    </AppCard>
  )
}
