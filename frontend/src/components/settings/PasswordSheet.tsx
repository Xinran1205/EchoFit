import { useEffect, useState } from 'react'
import { Button, Input, Popup, Toast } from 'antd-mobile'

type PasswordSheetSubmitPayload = {
  newPassword: string
  verificationCode: string
}

type PasswordSheetProps = {
  countdownSeconds: number
  email: string
  onClose: () => void
  onSendCode: () => void
  onSubmit: (payload: PasswordSheetSubmitPayload) => Promise<void> | void
  open: boolean
  saving?: boolean
  sendingCode?: boolean
}

export function PasswordSheet({
  countdownSeconds,
  email,
  onClose,
  onSendCode,
  onSubmit,
  open,
  saving = false,
  sendingCode = false
}: PasswordSheetProps) {
  const [verificationCode, setVerificationCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  useEffect(() => {
    if (open) {
      return
    }

    setVerificationCode('')
    setNewPassword('')
    setConfirmPassword('')
  }, [open])

  async function handleSubmit() {
    if (!/^\d{6}$/.test(verificationCode.trim())) {
      Toast.show({ content: '请输入 6 位验证码' })
      return
    }

    if (newPassword.length < 8) {
      Toast.show({ content: '新密码至少 8 位' })
      return
    }

    if (newPassword !== confirmPassword) {
      Toast.show({ content: '两次输入的密码不一致' })
      return
    }

    await onSubmit({
      newPassword,
      verificationCode: verificationCode.trim()
    })
  }

  return (
    <Popup
      visible={open}
      position="bottom"
      bodyStyle={{ borderRadius: '28px 28px 0 0' }}
      onMaskClick={onClose}
    >
      <div className="sheet-body password-sheet">
        <div className="card-title">修改密码</div>
        <div className="sheet-caption">验证码将发送到当前账号邮箱。</div>

        <div className="password-sheet__stack">
          <div className="sheet-surface">
            <div className="sheet-readonly-row">
              <span className="field-label">账号</span>
              <strong className="sheet-readonly-row__value">{email}</strong>
            </div>
          </div>

          <div className="sheet-surface">
            <div className="sheet-field__label">验证码</div>
            <div className="sheet-code-row">
              <Input
                value={verificationCode}
                onChange={setVerificationCode}
                placeholder="输入 6 位验证码"
                clearable
                maxLength={6}
                className="sheet-inline-input"
              />
              <button
                type="button"
                className="sheet-inline-button pressable"
                disabled={sendingCode || countdownSeconds > 0}
                onClick={onSendCode}
              >
                {countdownSeconds > 0 ? `${countdownSeconds}s` : '发送验证码'}
              </button>
            </div>
          </div>

          <div className="sheet-surface">
            <div className="sheet-field__label">新密码</div>
            <Input
              value={newPassword}
              onChange={setNewPassword}
              placeholder="至少 8 位"
              clearable
              type="password"
              className="sheet-inline-input"
            />
          </div>

          <div className="sheet-surface">
            <div className="sheet-field__label">确认密码</div>
            <Input
              value={confirmPassword}
              onChange={setConfirmPassword}
              placeholder="再次输入新密码"
              clearable
              type="password"
              className="sheet-inline-input"
            />
          </div>
        </div>

        <div className="sheet-footer">
          <Button
            block
            color="primary"
            size="large"
            className="app-primary-button"
            loading={saving}
            onClick={() => {
              void handleSubmit()
            }}
          >
            保存新密码
          </Button>
        </div>
      </div>
    </Popup>
  )
}
