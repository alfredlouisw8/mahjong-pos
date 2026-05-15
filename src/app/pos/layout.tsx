import { createAuthClient } from "@/lib/supabase/auth-server"
import { PosSidebar } from "@/components/layout/PosSidebar"
import { PosBottomNav } from "@/components/layout/PosBottomNav"
import { PosGuard } from "@/components/layout/PosGuard"

export default async function PosLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createAuthClient()
  const { data: { user } } = await supabase.auth.getUser()
  const isAdmin = !!user

  return (
    <div className="flex min-h-screen bg-[#0a120e]">
      <PosSidebar isAdmin={isAdmin} />
      <PosGuard isAdmin={isAdmin} />
      <div className="flex-1 pb-16 md:pb-0 overflow-auto">
        {children}
      </div>
      <PosBottomNav isAdmin={isAdmin} />
    </div>
  )
}
