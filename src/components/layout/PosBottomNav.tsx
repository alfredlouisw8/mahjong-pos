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

export function PosBottomNav({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[rgba(20,36,28,0.95)] border-t border-[rgba(255,255,255,0.08)] z-50 md:hidden">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 py-3 px-4 text-xs transition-colors",
                isActive ? "text-[#f59e0b]" : "text-[rgba(254,249,236,0.5)] hover:text-[#fef9ec]"
              )}
            >
              <item.icon size={20} />
              {item.label}
            </Link>
          )
        })}
        {isAdmin && (
          <Link
            href="/admin"
            className="flex flex-col items-center gap-1 py-3 px-4 text-xs text-[rgba(254,249,236,0.5)] hover:text-[#fef9ec] transition-colors"
          >
            <ArrowLeft size={20} />
            Admin
          </Link>
        )}
      </div>
    </nav>
  )
}
