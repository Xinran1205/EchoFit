import { TabBar, DotLoading } from 'antd-mobile'
import { AppOutline, CalendarOutline } from 'antd-mobile-icons'
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../features/auth/auth.store'
import { AppCard } from './AppCard'
import { AppPage } from './AppPage'

const tabs = [
  { key: '/', title: '首页', icon: <AppOutline /> },
  { key: '/log', title: '日志', icon: <CalendarOutline /> }
]

export function AppShell() {
  const location = useLocation()
  const navigate = useNavigate()
  const status = useAuthStore((state) => state.status)
  const showTabBar = location.pathname === '/' || location.pathname === '/log'

  if (status === 'checking') {
    return (
      <AppPage>
        <AppCard className="status-card">
          <DotLoading color="primary" />
          <div className="status-card__text">正在同步账号状态...</div>
        </AppCard>
      </AppPage>
    )
  }

  if (status !== 'authenticated') {
    return <Navigate replace to="/login" state={{ from: location }} />
  }

  return (
    <div className="app-shell">
      <Outlet />
      {showTabBar ? (
        <div className="app-tabbar">
          <div className="app-page-inner">
            <TabBar activeKey={location.pathname} onChange={(key) => navigate(key)} safeArea>
              {tabs.map((tab) => (
                <TabBar.Item key={tab.key} icon={tab.icon} title={tab.title} />
              ))}
            </TabBar>
          </div>
        </div>
      ) : null}
    </div>
  )
}
