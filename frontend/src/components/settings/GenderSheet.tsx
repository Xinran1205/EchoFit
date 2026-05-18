import { Button, Popup } from 'antd-mobile'
import { CheckOutline } from 'antd-mobile-icons'
import { userGenderOptions } from '../../features/auth/auth.dictionary'
import type { UserGender } from '../../features/auth/auth.types'

type GenderSheetProps = {
  confirmText: string
  loading?: boolean
  onClose: () => void
  onConfirm: (gender: UserGender) => void
  onSecondaryAction?: () => void
  open: boolean
  secondaryActionLabel?: string
  title: string
  value: UserGender
  onValueChange: (gender: UserGender) => void
}

export function GenderSheet({
  confirmText,
  loading = false,
  onClose,
  onConfirm,
  onSecondaryAction,
  open,
  secondaryActionLabel,
  title,
  value,
  onValueChange
}: GenderSheetProps) {
  return (
    <Popup
      visible={open}
      position="bottom"
      bodyStyle={{ borderRadius: '28px 28px 0 0' }}
      onMaskClick={onClose}
    >
      <div className="sheet-body gender-sheet">
        <div className="card-title">{title}</div>

        <div className="gender-options">
          {userGenderOptions.map((option) => {
            const active = value === option.value

            return (
              <button
                key={option.value}
                type="button"
                className={active ? 'gender-option gender-option--active' : 'gender-option'}
                onClick={() => onValueChange(option.value)}
              >
                <div className="gender-option__topline">
                  <span className="gender-option__title">{option.title}</span>
                  {active ? (
                    <span className="gender-option__check">
                      <CheckOutline />
                    </span>
                  ) : null}
                </div>
              </button>
            )
          })}
        </div>

        <div className="sheet-footer">
          <Button
            block
            color="primary"
            size="large"
            className="app-primary-button"
            loading={loading}
            onClick={() => onConfirm(value)}
          >
            {confirmText}
          </Button>
          {secondaryActionLabel ? (
            <Button
              block
              fill="none"
              size="large"
              className="app-text-button"
              style={{ marginTop: '10px' }}
              onClick={onSecondaryAction}
            >
              {secondaryActionLabel}
            </Button>
          ) : null}
        </div>
      </div>
    </Popup>
  )
}
