import { NextResponse, type NextRequest } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/auth/guards"

export async function POST(request: NextRequest, ctx: DynContext<"/api/admin/inventory/[id]/waste">) {
  const { error } = await requireAdmin()
  if (error) return error

  const { id } = await ctx.params
  const { quantity, notes } = await request.json()
  const supabase = createServiceClient()

  const { data: item } = await supabase.from("inventory_items").select("current_stock").eq("id", id).single()
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const newStock = Math.max(0, item.current_stock - quantity)
  await supabase.from("inventory_items").update({ current_stock: newStock, updated_at: new Date().toISOString() }).eq("id", id)
  await supabase.from("inventory_movements").insert({ inventory_item_id: id, action: "waste", quantity: -quantity, notes: notes ?? null })

  return NextResponse.json({ current_stock: newStock })
}
