import { AppCard } from '../app/AppCard'
import type { RestDay } from '../../features/training/training.types'
import { formatDisplayDate, formatWeekday } from '../../utils/date'

type RestDayCardProps = {
  restDay: RestDay
}

export function RestDayCard({ restDay }: RestDayCardProps) {
  return (
    <AppCard className="rest-day-card">
      <div className="rest-day-card__eyebrow">休息日</div>
      <div className="card-title">
        {formatDisplayDate(restDay.date)} {formatWeekday(restDay.date)}
      </div>
      <div className="rest-day-card__message">这一天已记录为休息日。</div>
      {restDay.note ? <div className="rest-day-card__note">“{restDay.note}”</div> : null}
    </AppCard>
  )
}
