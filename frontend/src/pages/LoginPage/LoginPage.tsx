import { useState } from 'react'
import { Button, Form, Input, Toast } from 'antd-mobile'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { AppCard } from '../../components/app/AppCard'
import { AppPage } from '../../components/app/AppPage'
import {
  login,
  register,
  sendRegisterVerificationCode
} from '../../features/auth/auth.api'
import { useCooldownCountdown } from '../../hooks/useCooldownCountdown'
import { useAuthStore } from '../../features/auth/auth.store'
import { getErrorMessage } from '../../lib/api'

type AuthFormValues = {
  email: string
  password: string
  verificationCode?: string
}

type FromLocationState = {
  from?: {
    pathname?: string
  }
}

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const setSession = useAuthStore((state) => state.setSession)
  const status = useAuthStore((state) => state.status)
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [loading, setLoading] = useState(false)
  const [codeSending, setCodeSending] = useState(false)
  const [emailDraft, setEmailDraft] = useState('')
  const { remainingSeconds: registerCodeCountdown, startCountdown: startRegisterCodeCountdown } =
    useCooldownCountdown()

  const fromPath =
    (location.state as FromLocationState | null)?.from?.pathname &&
    (location.state as FromLocationState | null)?.from?.pathname !== '/login'
      ? (location.state as FromLocationState).from?.pathname ?? '/'
      : '/'

  if (status === 'authenticated') {
    return <Navigate replace to={fromPath} />
  }

  const canSendRegisterCode =
    !codeSending &&
    registerCodeCountdown === 0 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailDraft.trim())

  async function handleSendRegisterCode() {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailDraft.trim())) {
      Toast.show({ content: '请先输入正确的邮箱' })
      return
    }

    setCodeSending(true)
    try {
      await sendRegisterVerificationCode(emailDraft.trim())
      startRegisterCodeCountdown(60)
      Toast.show({ content: '验证码已发送，请查看邮箱' })
    } catch (error) {
      Toast.show({ content: getErrorMessage(error, '验证码发送失败，请稍后再试') })
    } finally {
      setCodeSending(false)
    }
  }

  return (
    <AppPage className="auth-page">
      <div className="auth-hero">
        <div className="auth-hero__mark">
          <img src="/apple-touch-icon.png" alt="EchoFit" />
        </div>
        <div className="auth-hero__title">EchoFit</div>
        <div className="auth-hero__subtitle">
          一个安静、克制的私人训练记录空间！
        </div>
      </div>

      <section className="app-section">
        <AppCard className="auth-card">
          <div className="toggle-row">
            <button
              type="button"
              className={mode === 'login' ? 'segment segment--active' : 'segment'}
              onClick={() => setMode('login')}
            >
              登录
            </button>
            <button
              type="button"
              className={mode === 'register' ? 'segment segment--active' : 'segment'}
              onClick={() => setMode('register')}
            >
              注册
            </button>
          </div>

          <Form
            onValuesChange={(_, values) => {
              const nextValues = values as Partial<AuthFormValues>
              setEmailDraft(nextValues.email ?? '')
            }}
            layout="vertical"
            style={{ marginTop: '18px' }}
            onFinish={async (values) => {
              const formValues = values as AuthFormValues
              setLoading(true)

              try {
                const session =
                  mode === 'login'
                    ? await login({
                        email: formValues.email,
                        password: formValues.password
                      })
                    : await register({
                        email: formValues.email,
                        password: formValues.password,
                        verificationCode: formValues.verificationCode ?? ''
                      })

                setSession(session)
                Toast.show({ content: mode === 'login' ? '登录成功' : '注册成功' })
                navigate(mode === 'login' ? fromPath : '/', {
                  replace: true,
                  state: mode === 'register' ? { promptGender: true } : undefined
                })
              } catch (error) {
                Toast.show({
                  content: getErrorMessage(
                    error,
                    mode === 'login' ? '登录失败，请重试' : '注册失败，请重试'
                  )
                })
              } finally {
                setLoading(false)
              }
            }}
            footer={
              <Button
                block
                color="primary"
                size="large"
                className="app-primary-button"
                loading={loading}
                type="submit"
              >
                {mode === 'login' ? '进入 EchoFit' : '创建账号'}
              </Button>
            }
          >
            <Form.Item
              name="email"
              label="邮箱"
              rules={[{ required: true, message: '请输入邮箱' }]}
            >
              <Input placeholder="echo@example.com" clearable />
            </Form.Item>
            {mode === 'register' ? (
              <Form.Item
                name="verificationCode"
                label="验证码"
                rules={[
                  { required: true, message: '请输入验证码' },
                  { pattern: /^\d{6}$/, message: '验证码应为 6 位数字' }
                ]}
                extra={
                  <button
                    type="button"
                    className="auth-code-button pressable"
                    disabled={!canSendRegisterCode}
                    onClick={() => {
                      void handleSendRegisterCode()
                    }}
                  >
                    {registerCodeCountdown > 0 ? `${registerCodeCountdown}s` : '发送验证码'}
                  </button>
                }
              >
                <Input placeholder="输入 6 位验证码" clearable maxLength={6} />
              </Form.Item>
            ) : null}
            <Form.Item
              name="password"
              label="密码"
              rules={[
                { required: true, message: '请输入密码' },
                { min: 8, message: '密码至少 8 位' }
              ]}
            >
              <Input placeholder="至少 8 位" clearable type="password" />
            </Form.Item>
          </Form>
        </AppCard>
      </section>
    </AppPage>
  )
}
