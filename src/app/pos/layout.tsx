import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { PosBottomNav } from "@/components/layout/PosBottomNav"

export default function PosLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0a120e] pb-16 md:pb-0">
      <header className="flex items-center px-4 py-3 border-b border-[rgba(255,255,255,0.08)]">
        <Link
          href="/admin"
          className="flex items-center gap-1.5 text-sm text-[rgba(254,249,236,0.5)] hover:text-[#fef9ec] transition-colors"
        >
          <ArrowLeft size={16} />
          Admin
        </Link>
      </header>
      {children}
      <PosBottomNav />
    </div>
  )
}
