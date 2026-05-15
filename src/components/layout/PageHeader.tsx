interface PageHeaderProps {
  title: string
  subtitle?: string
  action?: React.ReactNode
}

export function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="font-[family-name:var(--font-cormorant)] text-3xl italic text-[#fef9ec]">
          {title}
        </h1>
        {subtitle && <p className="text-sm text-[rgba(251,191,36,0.55)] mt-1">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}
