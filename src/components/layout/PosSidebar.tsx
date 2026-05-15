"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Square, ShoppingCart, CalendarDays, Clock, ArrowLeft } from "lucide-react"

const navItems = [
  { href: "/pos/tables", icon: Square, label: "Tables" },
  { href: "/pos/orders", icon: ShoppingCart, label: "Orders" },
  { href: "/pos/reservations", icon: CalendarDays, label: "Reservations" },
  { href: "/pos/shift", icon: Clock, label: "Shift" },
]

export function PosSidebar({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname()

  return (
    <aside className="hidden md:flex w-56 min-h-screen bg-[rgba(20,36,28,0.85)] border-r border-[rgba(255,255,255,0.08)] flex-col shrink-0">
      <div className="p-6 border-b border-[rgba(255,255,255,0.08)]">
        <h1 className="font-[family-name:var(--font-cormorant)] text-2xl italic text-[#f59e0b]">
          Mahjong Royale
        </h1>
        <p className="text-xs text-[rgba(251,191,36,0.55)] mt-1">POS</p>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                isActive
                  ? "bg-[rgba(245,158,11,0.15)] text-[#f59e0b] border border-[rgba(251,191,36,0.25)]"
                  : "text-[rgba(254,249,236,0.7)] hover:text-[#fef9ec] hover:bg-[rgba(40,56,44,0.6)]"
              )}
            >
              <item.icon size={16} />
              {item.label}
            </Link>
          )
        })}
      </nav>
      {isAdmin && (
        <div className="p-4 border-t border-[rgba(255,255,255,0.08)]">
          <Link
            href="/admin"
            className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-[rgba(254,249,236,0.5)] hover:text-[#fef9ec] hover:bg-[rgba(40,56,44,0.6)] transition-colors"
          >
            <ArrowLeft size={14} />
            Admin Dashboard
          </Link>
        </div>
      )}
    </aside>
  )
}
