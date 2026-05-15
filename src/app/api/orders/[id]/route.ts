import { NextResponse, type NextRequest } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"
import { requireAnyStaff } from "@/lib/auth/guards"
import { deductInventoryForOrder } from "@/lib/inventory"

export async function PATCH(request: NextRequest, ctx: DynContext<"/api/orders/[id]">) {
  const { error, cashier } = await requireAnyStaff()
  if (error) return error

  const { id } = await ctx.params
  const body = await request.json()
  const supabase = createServiceClient()

  const wasConfirming = body.status === "confirmed"

  const { data: order } = await supabase
    .from("orders")
    .select("*, menu_items(track_inventory)")
    .eq("id", id)
    .single()

  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 })

  const { data, error: dbError } = await supabase
    .from("orders")
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single()

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })

  if (wasConfirming && order.status === "pending" && order.menu_items?.track_inventory) {
    await deductInventoryForOrder(supabase, id, order.menu_item_id, order.quantity, cashier?.cashierId ?? null)
  }

  return NextResponse.json(data)
}

export async function DELETE(_req: NextRequest, ctx: DynContext<"/api/orders/[id]">) {
  const { error } = await requireAnyStaff()
  if (error) return error

  const { id } = await ctx.params
  const supabase = createServiceClient()

  const { error: dbError } = await supabase.from("orders").delete().eq("id", id)
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
