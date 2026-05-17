import { Picker } from 'antd-mobile'
import { RightOutline } from 'antd-mobile-icons'

const durationColumns = [
  Array.from({ length: 60 }, (_, index) => {
    const value = String((index + 1) * 5)
    return {
      label: `${value} 分钟`,
      value
    }
  })
]

type DurationPickerFieldProps = {
  value?: number
  onChange: (value: number) => void
}

export function DurationPickerField({
  value,
  onChange
}: DurationPickerFieldProps) {
  return (
    <Picker
      columns={durationColumns}
      value={value ? [String(value)] : []}
      title="选择训练时长"
      onConfirm={(items) => {
        const nextValue = Number(items[0])
        if (!Number.isNaN(nextValue)) {
          onChange(nextValue)
        }
      }}
    >
      {(_, actions) => (
        <button type="button" className="field-trigger pressable" onClick={actions.open}>
          <span className="field-copy">
            <span className="field-label">训练时长</span>
          </span>
          <span className="field-affordance">
            <strong className="field-value">{value ? `${value} 分钟` : '请选择'}</strong>
            <RightOutline className="field-chevron" />
          </span>
        </button>
      )}
    </Picker>
  )
}
