import { useState } from 'react'
import { Button, Form, Input, Toast } from 'antd-mobile'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { AppCard } from '../../components/app/AppCard'
import { AppPage } from '../../components/app/AppPage'
import { login, register } from '../../features/auth/auth.api'
import { useAuthStore } from '../../features/auth/auth.store'
import { getErrorMessage } from '../../lib/api'

type LoginFormValues = {
  email: string
  password: string
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

  const fromPath =
    (location.state as FromLocationState | null)?.from?.pathname &&
    (location.state as FromLocationState | null)?.from?.pathname !== '/login'
      ? (location.state as FromLocationState).from?.pathname ?? '/'
      : '/'

  if (status === 'authenticated') {
    return <Navigate replace to={fromPath} />
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
            layout="vertical"
            style={{ marginTop: '18px' }}
            onFinish={async (values) => {
              const formValues = values as LoginFormValues
              setLoading(true)

              try {
                const session =
                  mode === 'login'
                    ? await login(formValues)
                    : await register(formValues)

                setSession(session)
                Toast.show({ content: mode === 'login' ? '登录成功' : '注册成功' })
                navigate(fromPath, { replace: true })
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
