import type { HTMLAttributes, ReactNode } from 'react'

type AppCardProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode
}

export function AppCard({ children, className, onClick, ...rest }: AppCardProps) {
  return (
    <div
      className={['app-card', onClick ? 'pressable' : '', className].filter(Boolean).join(' ')}
      onClick={onClick}
      {...rest}
    >
      {children}
    </div>
  )
}
