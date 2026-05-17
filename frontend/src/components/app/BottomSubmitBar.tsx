import { Button } from 'antd-mobile'

type BottomSubmitBarProps = {
  text: string
  disabled?: boolean
  loading?: boolean
  onClick: () => void
}

export function BottomSubmitBar({
  text,
  disabled,
  loading,
  onClick
}: BottomSubmitBarProps) {
  return (
    <div className="app-fixed-bottom">
      <div className="app-page-inner">
        <Button
          block
          color="primary"
          size="large"
          className="app-primary-button"
          disabled={disabled}
          loading={loading}
          onClick={onClick}
        >
          {text}
        </Button>
      </div>
    </div>
  )
}
