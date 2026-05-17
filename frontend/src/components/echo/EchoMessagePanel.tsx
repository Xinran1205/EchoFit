import { AppCard } from '../app/AppCard'

type EchoMessagePanelProps = {
  content: string
}

export function EchoMessagePanel({ content }: EchoMessagePanelProps) {
  return (
    <AppCard className="echo-card">
      <div className="echo-mark">今天的回声</div>
      <p className="echo-content">“{content}”</p>
    </AppCard>
  )
}
