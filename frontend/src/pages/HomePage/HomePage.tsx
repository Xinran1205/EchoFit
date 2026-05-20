import { useEffect, useRef, useState } from 'react'
import { Button, Dialog, DotLoading, TextArea, Toast } from 'antd-mobile'
import { SetOutline } from 'antd-mobile-icons'
import { useLocation, useNavigate } from 'react-router-dom'
import { AppCard } from '../../components/app/AppCard'
import { AppPage } from '../../components/app/AppPage'
import { PageHeader } from '../../components/app/PageHeader'
import { GenderSheet } from '../../components/settings/GenderSheet'
import { PasswordSheet } from '../../components/settings/PasswordSheet'
import { SettingsSheet } from '../../components/settings/SettingsSheet'
import { getUserGenderLabel } from '../../features/auth/auth.dictionary'
import {
  sendPasswordChangeVerificationCode,
  updatePassword,
  updateUserProfile
} from '../../features/auth/auth.api'
import { useCooldownCountdown } from '../../hooks/useCooldownCountdown'
import { useAuthStore } from '../../features/auth/auth.store'
import type { UserGender } from '../../features/auth/auth.types'
import { getReminderConfig, updateReminderConfig } from '../../features/reminder/reminder.api'
import type { ReminderConfig } from '../../features/reminder/reminder.types'
import {
  getTrainingPartLabel,
  trainingPartOptions
} from '../../features/training/training.dictionary'
import {
  createRestDay,
  getHomeSummary
} from '../../features/training/training.api'
import type { HomeSummary } from '../../features/training/training.types'
import { getErrorMessage } from '../../lib/api'
import { formatDisplayDate, formatDuration, formatWeekday } from '../../utils/date'

type HomeLocationState = {
  promptGender?: boolean
}

export function HomePage() {
  const location = useLocation()
  const navigate = useNavigate()
  const clearSession = useAuthStore((state) => state.clearSession)
  const currentUser = useAuthStore((state) => state.user)
  const syncCurrentUser = useAuthStore((state) => state.syncCurrentUser)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [genderSheetMode, setGenderSheetMode] = useState<'onboarding' | 'settings' | null>(null)
  const [selectedGender, setSelectedGender] = useState<UserGender>(currentUser?.gender ?? 'male')
  const [summary, setSummary] = useState<HomeSummary | null>(null)
  const [reminderConfig, setReminderConfig] = useState<ReminderConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [reminderLoading, setReminderLoading] = useState(false)
  const [genderSaving, setGenderSaving] = useState(false)
  const [passwordSheetOpen, setPasswordSheetOpen] = useState(false)
  const [passwordCodeSending, setPasswordCodeSending] = useState(false)
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [restDialogOpen, setRestDialogOpen] = useState(false)
  const [restSaving, setRestSaving] = useState(false)
  const [restNoteDraft, setRestNoteDraft] = useState('')
  const genderSheetTimerRef = useRef<number | null>(null)
  const passwordSheetTimerRef = useRef<number | null>(null)
  const {
    remainingSeconds: passwordCodeCountdown,
    resetCountdown: resetPasswordCodeCountdown,
    startCountdown: startPasswordCodeCountdown
  } = useCooldownCountdown()

  useEffect(() => {
    return () => {
      if (genderSheetTimerRef.current !== null) {
        window.clearTimeout(genderSheetTimerRef.current)
      }
      if (passwordSheetTimerRef.current !== null) {
        window.clearTimeout(passwordSheetTimerRef.current)
      }
    }
  }, [])

  useEffect(() => {
    setSelectedGender(currentUser?.gender ?? 'male')
  }, [currentUser?.gender])

  useEffect(() => {
    if (!(location.state as HomeLocationState | null)?.promptGender) {
      return
    }

    setSelectedGender(currentUser?.gender ?? 'male')
    setGenderSheetMode('onboarding')
    navigate(location.pathname, { replace: true })
  }, [currentUser?.gender, location.pathname, location.state, navigate])

  useEffect(() => {
    let active = true

    async function loadHome() {
      setLoading(true)
      setErrorMessage('')

      try {
        const [nextSummary, nextReminderConfig] = await Promise.all([
          getHomeSummary(),
          getReminderConfig()
        ])

        if (!active) {
          return
        }

        setSummary(nextSummary)
        setReminderConfig(nextReminderConfig)
      } catch (error) {
        if (!active) {
          return
        }

        setErrorMessage(getErrorMessage(error, '首页数据加载失败'))
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    void loadHome()

    return () => {
      active = false
    }
  }, [])

  async function refreshHomeSummary() {
    const nextSummary = await getHomeSummary()
    setSummary(nextSummary)
  }

  async function handleReminderChange(enabled: boolean) {
    if (!reminderConfig) {
      return
    }

    const previousConfig = reminderConfig
    setReminderLoading(true)
    setReminderConfig({ ...previousConfig, enabled })

    try {
      const nextConfig = await updateReminderConfig({ enabled })
      setReminderConfig(nextConfig)
      Toast.show({ content: enabled ? '提醒已开启' : '提醒已关闭' })
    } catch (error) {
      setReminderConfig(previousConfig)
      Toast.show({ content: getErrorMessage(error, '提醒设置保存失败') })
    } finally {
      setReminderLoading(false)
    }
  }

  async function handleGenderConfirm(nextGender: UserGender) {
    if (!currentUser) {
      return
    }

    if (currentUser.gender === nextGender) {
      setGenderSheetMode(null)
      return
    }

    setGenderSaving(true)

    try {
      const nextUser = await updateUserProfile({ gender: nextGender })
      syncCurrentUser(nextUser)
      setGenderSheetMode(null)
      Toast.show({
        content: `已设置为${getUserGenderLabel(nextGender)}`
      })
    } catch (error) {
      Toast.show({ content: getErrorMessage(error, '性别设置保存失败') })
    } finally {
      setGenderSaving(false)
    }
  }

  async function handleSendPasswordCode() {
    setPasswordCodeSending(true)

    try {
      await sendPasswordChangeVerificationCode()
      startPasswordCodeCountdown(60)
      Toast.show({ content: '验证码已发送，请查看邮箱' })
    } catch (error) {
      Toast.show({ content: getErrorMessage(error, '验证码发送失败，请稍后再试') })
    } finally {
      setPasswordCodeSending(false)
    }
  }

  async function handleUpdatePassword(payload: {
    newPassword: string
    verificationCode: string
  }) {
    setPasswordSaving(true)

    try {
      await updatePassword(payload)
      resetPasswordCodeCountdown()
      setPasswordSheetOpen(false)
      Toast.show({ content: '密码已更新' })
    } catch (error) {
      Toast.show({ content: getErrorMessage(error, '密码更新失败') })
    } finally {
      setPasswordSaving(false)
    }
  }

  async function handleCreateRestDay() {
    const targetDate = summary?.today ?? new Date().toISOString().slice(0, 10)
    setRestSaving(true)

    try {
      await createRestDay({
        date: targetDate,
        note: restNoteDraft.trim() || undefined
      })
      await refreshHomeSummary()
      setRestDialogOpen(false)
      setRestNoteDraft('')
      Toast.show({ content: '今天已标记为休息日' })
    } catch (error) {
      Toast.show({ content: getErrorMessage(error, '休息日保存失败') })
    } finally {
      setRestSaving(false)
    }
  }

  const todayEntryType = summary?.todayEntryType ?? null
  const todayDate = summary?.today ?? new Date().toISOString().slice(0, 10)

  return (
    <AppPage>
      <PageHeader
        title="今天"
        subtitle={summary ? `${formatDisplayDate(summary.today)} ${formatWeekday(summary.today)}` : undefined}
        extra={
          <button
            type="button"
            className="icon-button icon-button--hero pressable"
            onClick={() => setSettingsOpen(true)}
          >
            <SetOutline />
          </button>
        }
      />

      <section className="app-section">
        <AppCard className="summary-card">
          <div className="summary-card__header">
            <div className="card-title">最近 7 天</div>
            {summary ? (
              <span className="summary-chip">{summary.last7Days.trainingDays} 天有训练记录</span>
            ) : null}
          </div>

          {loading ? (
            <div className="status-card">
              <DotLoading color="primary" />
              <div className="status-card__text">正在加载训练摘要...</div>
            </div>
          ) : errorMessage ? (
            <div className="status-card">
              <div className="status-card__text">{errorMessage}</div>
            </div>
          ) : summary ? (
            <>
              <div className="stats-grid">
                <div className="stat-box">
                  <span>训练天数</span>
                  <strong>{summary.last7Days.trainingDays}</strong>
                </div>
                <div className="stat-box">
                  <span>累计时长</span>
                  <strong>{formatDuration(summary.last7Days.totalDurationMinutes)}</strong>
                </div>
              </div>
              <div className="app-muted" style={{ marginTop: '18px', marginBottom: '10px' }}>
                部位分布
              </div>
              <div className="pill-list">
                {trainingPartOptions.map((part) => (
                  <span key={part.value} className="pill">
                    {getTrainingPartLabel(part.value)} {summary.last7Days.partCounts[part.value] ?? 0}
                  </span>
                ))}
              </div>
            </>
          ) : null}
        </AppCard>
      </section>

      <section className="app-section">
        <AppCard
          className={[
            'today-card',
            !summary?.todayRecorded ? 'today-card--actionable' : '',
            todayEntryType === 'rest' ? 'today-card--resting' : ''
          ]
            .filter(Boolean)
            .join(' ')}
        >
          <div className="today-card__wave" />

          {todayEntryType === 'training' ? (
            <>
              <div className="summary-chip summary-chip--training">已记录</div>
              <div className="today-card__message">今天已经记下了。</div>
              <Button
                block
                color="primary"
                fill="outline"
                className="app-secondary-button"
                style={{ marginTop: '18px' }}
                onClick={() => navigate('/log')}
              >
                去日志看今天
              </Button>
            </>
          ) : todayEntryType === 'rest' ? (
            <>
              <div className="summary-chip summary-chip--rest">休息日</div>
              <div className="today-card__message">今天留给休息。</div>
              {summary?.todayRestNote ? (
                <div className="today-card__quote">“{summary.todayRestNote}”</div>
              ) : null}
              <Button
                block
                color="primary"
                fill="outline"
                className="app-secondary-button"
                style={{ marginTop: '18px' }}
                onClick={() => navigate('/log')}
              >
                去日志看今天
              </Button>
            </>
          ) : (
            <>
              <div className="today-card__prompt">今天的节奏</div>
              <div className="today-card__action-stack">
                <Button
                  block
                  color="primary"
                  size="large"
                  className="app-primary-button"
                  disabled={loading}
                  onClick={() => {
                    navigate(`/record/new?date=${todayDate}&source=home`)
                  }}
                >
                  记录今天训练
                </Button>
                <Button
                  block
                  color="primary"
                  fill="outline"
                  className="app-secondary-button today-card__rest-button"
                  disabled={loading}
                  onClick={() => setRestDialogOpen(true)}
                >
                  标记今天休息
                </Button>
              </div>
            </>
          )}
        </AppCard>
      </section>

      <Dialog
        visible={restDialogOpen}
        content={
          <div className="rest-dialog">
            <div className="rest-dialog__text">允许自己慢一点。</div>
            <TextArea
              rows={3}
              maxLength={100}
              placeholder="写一句心情或感悟（选填）"
              value={restNoteDraft}
              onChange={setRestNoteDraft}
              style={{ marginTop: '14px' }}
            />
            <div className="rest-dialog__actions">
              <Button
                block
                color="primary"
                fill="outline"
                className="app-secondary-button today-card__rest-button rest-dialog__button"
                disabled={restSaving}
                onClick={() => {
                  setRestDialogOpen(false)
                  setRestNoteDraft('')
                }}
              >
                再想想
              </Button>
              <Button
                block
                color="primary"
                fill="outline"
                className="app-secondary-button today-card__rest-button rest-dialog__button"
                disabled={restSaving}
                onClick={() => {
                  void handleCreateRestDay()
                }}
              >
                {restSaving ? '保存中...' : '今天休息'}
              </Button>
            </div>
          </div>
        }
        closeOnMaskClick={!restSaving}
        onClose={() => {
          if (!restSaving) {
            setRestDialogOpen(false)
            setRestNoteDraft('')
          }
        }}
      />

      <SettingsSheet
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onOpenGender={() => {
          setSettingsOpen(false)
          setSelectedGender(currentUser?.gender ?? 'male')
          if (genderSheetTimerRef.current !== null) {
            window.clearTimeout(genderSheetTimerRef.current)
          }
          genderSheetTimerRef.current = window.setTimeout(() => {
            setGenderSheetMode('settings')
            genderSheetTimerRef.current = null
          }, 140)
        }}
        onOpenPassword={() => {
          setSettingsOpen(false)
          if (passwordSheetTimerRef.current !== null) {
            window.clearTimeout(passwordSheetTimerRef.current)
          }
          passwordSheetTimerRef.current = window.setTimeout(() => {
            setPasswordSheetOpen(true)
            passwordSheetTimerRef.current = null
          }, 140)
        }}
        userEmail={currentUser?.email ?? ''}
        userGenderLabel={getUserGenderLabel(currentUser?.gender ?? 'male')}
        reminderEnabled={reminderConfig?.enabled ?? true}
        reminderLoading={reminderLoading}
        onReminderChange={handleReminderChange}
        onLogout={() => {
          setSettingsOpen(false)
          clearSession()
          Toast.show({ content: '已退出登录' })
        }}
      />

      <GenderSheet
        open={genderSheetMode !== null}
        title={genderSheetMode === 'onboarding' ? '选择性别' : '性别'}
        value={selectedGender}
        onValueChange={setSelectedGender}
        loading={genderSaving}
        confirmText={genderSheetMode === 'onboarding' ? '继续' : '保存'}
        secondaryActionLabel={genderSheetMode === 'onboarding' ? '跳过' : undefined}
        onSecondaryAction={() => setGenderSheetMode(null)}
        onClose={() => setGenderSheetMode(null)}
        onConfirm={handleGenderConfirm}
      />

      <PasswordSheet
        open={passwordSheetOpen}
        email={currentUser?.email ?? ''}
        countdownSeconds={passwordCodeCountdown}
        sendingCode={passwordCodeSending}
        saving={passwordSaving}
        onClose={() => setPasswordSheetOpen(false)}
        onSendCode={() => {
          void handleSendPasswordCode()
        }}
        onSubmit={handleUpdatePassword}
      />
    </AppPage>
  )
}
