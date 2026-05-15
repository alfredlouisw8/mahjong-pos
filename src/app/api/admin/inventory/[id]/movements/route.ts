import { NextResponse, type NextRequest } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/auth/guards"

export async function GET(_req: NextRequest, ctx: DynContext<"/api/admin/inventory/[id]/movements">) {
  const { error } = await requireAdmin()
  if (error) return error

  const { id } = await ctx.params
  const supabase = createServiceClient()
  const { data, error: dbError } = await supabase
    .from("inventory_movements")
    .select(`*, cashiers(id, name)`)
    .eq("inventory_item_id", id)
    .order("created_at", { ascending: false })

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
  return NextResponse.json(data)
}
