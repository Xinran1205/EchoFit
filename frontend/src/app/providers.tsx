import { useEffect, type ReactNode } from 'react'
import { ConfigProvider, DotLoading } from 'antd-mobile'
import zhCN from 'antd-mobile/es/locales/zh-CN'
import { useAuthStore } from '../features/auth/auth.store'
import { setUnauthorizedHandler } from '../lib/api'

type ProvidersProps = {
  children: ReactNode
}

function AuthBootstrap({ children }: ProvidersProps) {
  const bootstrapped = useAuthStore((state) => state.bootstrapped)
  const bootstrap = useAuthStore((state) => state.bootstrap)
  const clearSession = useAuthStore((state) => state.clearSession)

  useEffect(() => {
    setUnauthorizedHandler(clearSession)
    void bootstrap()

    return () => {
      setUnauthorizedHandler(null)
    }
  }, [bootstrap, clearSession])

  if (!bootstrapped) {
    return (
      <main className="app-page page-enter">
        <div className="app-page-inner">
          <div className="app-card status-card">
            <DotLoading color="primary" />
            <div className="status-card__text">正在连接 EchoFit...</div>
          </div>
        </div>
      </main>
    )
  }

  return <>{children}</>
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ConfigProvider locale={zhCN}>
      <AuthBootstrap>{children}</AuthBootstrap>
    </ConfigProvider>
  )
}
