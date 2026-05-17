import { useEffect, useState } from 'react'
import { Button, Popup, TextArea, Toast } from 'antd-mobile'
import { getErrorMessage } from '../../lib/api'

type FutureMessageSheetProps = {
  open: boolean
  onClose: () => void
  onSave: (content: string) => Promise<void>
}

export function FutureMessageSheet({
  open,
  onClose,
  onSave
}: FutureMessageSheetProps) {
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) {
      setContent('')
      setSaving(false)
    }
  }, [open])

  return (
    <Popup
      visible={open}
      position="bottom"
      bodyStyle={{ borderRadius: '24px 24px 0 0' }}
      onMaskClick={() => {
        if (!saving) {
          onClose()
        }
      }}
    >
      <div className="sheet-body">
        <div className="card-title">
          给未来训练日的自己留一句话
        </div>
        <div className="app-muted" style={{ marginTop: '8px', lineHeight: '1.65' }}>
          最多 50 字。下一次训练完成后，它有机会被带回来。
        </div>
        <TextArea
          placeholder="状态一般的时候，更要把节奏稳住。"
          maxLength={50}
          value={content}
          onChange={setContent}
          rows={4}
          style={{ marginTop: '18px' }}
        />
        <div className="sheet-footer">
          <Button
            block
            color="primary"
            className="app-primary-button"
            loading={saving}
            onClick={async () => {
              const nextContent = content.trim()
              if (!nextContent) {
                Toast.show({ content: '先写一句简短的话' })
                return
              }

              setSaving(true)
              try {
                await onSave(nextContent)
                onClose()
              } catch (error) {
                Toast.show({ content: getErrorMessage(error, '未来话保存失败') })
              } finally {
                setSaving(false)
              }
            }}
          >
            保存这句话
          </Button>
          <Button
            block
            fill="none"
            className="app-text-button"
            style={{ marginTop: '10px' }}
            disabled={saving}
            onClick={onClose}
          >
            暂时跳过
          </Button>
        </div>
      </div>
    </Popup>
  )
}
