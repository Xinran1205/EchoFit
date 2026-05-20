import { Button } from 'antd-mobile'
import type { TrainingRecord } from '../../features/training/training.types'
import {
  getTrainingMoodLabel,
  getTrainingPartLabel
} from '../../features/training/training.dictionary'
import { formatDisplayDate, formatDuration, formatWeekday } from '../../utils/date'
import { AppCard } from '../app/AppCard'
import { TrainingPhotoGallery } from './TrainingPhotoGallery'

type TrainingRecordCardProps = {
  record: TrainingRecord
  actionText?: string
  onAction?: () => void
}

export function TrainingRecordCard({
  record,
  actionText,
  onAction
}: TrainingRecordCardProps) {
  return (
    <AppCard>
      <div className="record-summary">
        <div>
          <div className="card-title">
            {formatDisplayDate(record.date)} {formatWeekday(record.date)}
          </div>
          <div className="app-muted" style={{ marginTop: '8px' }}>
            {formatDuration(record.durationMinutes)}
          </div>
        </div>
        <div className="pill-list">
          {record.parts.map((part) => (
            <span key={part} className="pill pill--soft">
              {getTrainingPartLabel(part)}
            </span>
          ))}
        </div>
      </div>

      {record.photos.length > 0 ? (
        <div className="record-photo-block">
          <div className="record-photo-block__header">
            <span className="record-photo-block__title">训练照片</span>
            <span className="record-photo-block__count">{record.photos.length} 张</span>
          </div>
          <TrainingPhotoGallery photos={record.photos} compact />
        </div>
      ) : null}

      <div className="detail-list">
        <div>状态：{getTrainingMoodLabel(record.mood)}</div>
        {record.weightKg !== undefined && record.weightKg !== null ? (
          <div>体重：{record.weightKg.toFixed(1)} kg</div>
        ) : null}
        {record.note ? <div>备注：{record.note}</div> : null}
        {record.futureMessagePreview ? <div>未来话：{record.futureMessagePreview}</div> : null}
      </div>

      {actionText && onAction ? (
        <Button
          block
          color="primary"
          fill="outline"
          className="app-secondary-button"
          style={{ marginTop: '18px' }}
          onClick={onAction}
        >
          {actionText}
        </Button>
      ) : null}
    </AppCard>
  )
}
