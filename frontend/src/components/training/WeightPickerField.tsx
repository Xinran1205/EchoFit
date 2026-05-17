import { Picker } from 'antd-mobile'
import { RightOutline } from 'antd-mobile-icons'

const weightColumns = [
  Array.from({ length: 1151 }, (_, index) => {
    const value = (35 + index * 0.1).toFixed(1)
    return {
      label: `${value} kg`,
      value
    }
  })
]

type WeightPickerFieldProps = {
  value?: number
  onChange: (value?: number) => void
}

export function WeightPickerField({
  value,
  onChange
}: WeightPickerFieldProps) {
  return (
    <Picker
      columns={weightColumns}
      value={value !== undefined ? [value.toFixed(1)] : []}
      title="选择体重"
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
            <span className="field-label">体重</span>
          </span>
          <span className="field-affordance">
            <strong className="field-value">
              {value !== undefined ? `${value.toFixed(1)} kg` : '使用上次体重'}
            </strong>
            <RightOutline className="field-chevron" />
          </span>
        </button>
      )}
    </Picker>
  )
}
