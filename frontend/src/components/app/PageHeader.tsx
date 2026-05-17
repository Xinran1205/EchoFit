import type { ReactNode } from 'react'

type PageHeaderProps = {
  title: string
  subtitle?: string
  extra?: ReactNode
}

export function PageHeader({ title, subtitle, extra }: PageHeaderProps) {
  return (
    <header className="page-header">
      <div>
        <div className="page-header__title">{title}</div>
        {subtitle ? <div className="page-header__meta">{subtitle}</div> : null}
      </div>
      {extra ? <div>{extra}</div> : null}
    </header>
  )
}

