import type { CSSProperties } from 'react'
import { Selector } from 'antd-mobile'
import type { TrainingPart } from '../../features/training/training.types'
import { trainingPartOptions } from '../../features/training/training.dictionary'

const selectorStyle = {
  '--border-radius': '999px',
  '--padding': '9px 12px',
  '--checked-color': 'var(--app-accent-soft)',
  '--checked-text-color': 'var(--app-accent)',
  '--color': 'var(--app-surface-muted)'
} as CSSProperties

type TrainingPartSelectorProps = {
  value: TrainingPart[]
  onChange: (value: TrainingPart[]) => void
}

export function TrainingPartSelector({
  value,
  onChange
}: TrainingPartSelectorProps) {
  return (
    <Selector
      multiple
      columns={4}
      options={trainingPartOptions}
      value={value}
      onChange={(next) => onChange(next as TrainingPart[])}
      style={selectorStyle}
    />
  )
}
