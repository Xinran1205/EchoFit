import type { ReactNode } from 'react'

type AppPageProps = {
  children: ReactNode
  className?: string
}

export function AppPage({ children, className }: AppPageProps) {
  return (
    <main className={['app-page', 'page-enter', className].filter(Boolean).join(' ')}>
      <div className="app-page-inner">{children}</div>
    </main>
  )
}

