import { NextResponse, type NextRequest } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"
import { requireAnyStaff } from "@/lib/auth/guards"

export async function GET(_req: NextRequest, ctx: DynContext<"/api/sessions/[id]/orders">) {
  const { error } = await requireAnyStaff()
  if (error) return error

  const { id } = await ctx.params
  const supabase = createServiceClient()
  const { data, error: dbError } = await supabase
    .from("orders")
    .select(`*, menu_items(id, name, category)`)
    .eq("session_id", id)
    .order("created_at")

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest, ctx: DynContext<"/api/sessions/[id]/orders">) {
  const { error } = await requireAnyStaff()
  if (error) return error

  const { id } = await ctx.params
  const body = await request.json()
  const supabase = createServiceClient()

  const { data: menuItem } = await supabase
    .from("menu_items")
    .select("price, cogs")
    .eq("id", body.menuItemId)
    .single()

  if (!menuItem) return NextResponse.json({ error: "Menu item not found" }, { status: 404 })

  const { data, error: dbError } = await supabase
    .from("orders")
    .insert({
      session_id: id,
      menu_item_id: body.menuItemId,
      quantity: body.quantity ?? 1,
      unit_price: menuItem.price,
      unit_cogs: menuItem.cogs,
      note: body.note ?? null,
      source: "cashier",
      status: "confirmed",
    })
    .select(`*, menu_items(id, name, category)`)
    .single()

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
