import { Dialog, List, Popup, Switch } from 'antd-mobile'

type SettingsSheetProps = {
  open: boolean
  onOpenGender: () => void
  onOpenPassword: () => void
  userEmail: string
  userGenderLabel: string
  reminderEnabled: boolean
  reminderLoading?: boolean
  onClose: () => void
  onReminderChange: (enabled: boolean) => void
  onLogout: () => void
}

export function SettingsSheet({
  open,
  onOpenGender,
  onOpenPassword,
  userEmail,
  userGenderLabel,
  reminderEnabled,
  reminderLoading = false,
  onClose,
  onReminderChange,
  onLogout
}: SettingsSheetProps) {
  return (
    <Popup
      visible={open}
      position="bottom"
      bodyStyle={{ borderRadius: '24px 24px 0 0' }}
      onMaskClick={onClose}
    >
      <div className="sheet-body settings-sheet">
        <div className="card-title">设置</div>
        <List style={{ marginTop: '14px' }}>
          <List.Item description={userEmail}>账号</List.Item>
          <List.Item
            clickable
            extra={<span className="settings-sheet__value">{userGenderLabel}</span>}
            onClick={onOpenGender}
          >
            性别
          </List.Item>
          <List.Item clickable onClick={onOpenPassword}>
            修改密码
          </List.Item>
          <List.Item
            extra={
              <Switch
                checked={reminderEnabled}
                disabled={reminderLoading}
                onChange={(checked) => onReminderChange(checked)}
              />
            }
            description="固定每天 20:00"
          >
            邮件提醒
          </List.Item>
          <List.Item
            clickable
            onClick={async () => {
              const confirmed = await Dialog.confirm({
                content: '确认退出当前账号吗？'
              })

              if (confirmed) {
                onLogout()
              }
            }}
          >
            退出登录
          </List.Item>
        </List>
      </div>
    </Popup>
  )
}
