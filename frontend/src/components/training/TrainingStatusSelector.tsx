import type { CSSProperties } from 'react'
import { Selector } from 'antd-mobile'
import type { TrainingMood } from '../../features/training/training.types'
import { trainingMoodOptions } from '../../features/training/training.dictionary'

const selectorStyle = {
  '--border-radius': '18px',
  '--padding': '14px 14px',
  '--checked-color': 'var(--app-accent-soft)',
  '--checked-text-color': 'var(--app-accent)',
  '--color': '#f5f1ea'
} as CSSProperties

type TrainingStatusSelectorProps = {
  value?: TrainingMood
  onChange: (value?: TrainingMood) => void
}

export function TrainingStatusSelector({
  value,
  onChange
}: TrainingStatusSelectorProps) {
  return (
    <Selector
      columns={1}
      options={trainingMoodOptions}
      value={value ? [value] : []}
      onChange={(next) => onChange((next[0] as TrainingMood | undefined) ?? undefined)}
      style={selectorStyle}
    />
  )
}
