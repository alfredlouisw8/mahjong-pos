import { NextResponse, type NextRequest } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"
import type { CustomerOrderRequest } from "@/types/api"

export async function POST(request: NextRequest) {
  const body: CustomerOrderRequest = await request.json()
  const { tableToken, items } = body

  if (!tableToken || !items?.length) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }

  const supabase = createServiceClient()

  const { data: table } = await supabase
    .from("tables")
    .select("id, current_session_id")
    .eq("qr_token", tableToken)
    .single()

  if (!table) return NextResponse.json({ error: "Table not found" }, { status: 404 })
  if (!table.current_session_id) {
    return NextResponse.json(
      { error: "Table not in session — please ask staff to start your table" },
      { status: 400 }
    )
  }

  const menuItemIds = items.map((i) => i.menuItemId)
  const { data: menuItems } = await supabase
    .from("menu_items")
    .select("id, price, cogs, is_available")
    .in("id", menuItemIds)

  const menuMap = Object.fromEntries((menuItems ?? []).map((m) => [m.id, m]))

  const ordersToInsert = items.map((item) => {
    const menuItem = menuMap[item.menuItemId]
    return {
      session_id: table.current_session_id,
      menu_item_id: item.menuItemId,
      quantity: item.quantity,
      unit_price: menuItem?.price ?? 0,
      unit_cogs: menuItem?.cogs ?? 0,
      note: item.note ?? null,
      source: "customer_qr",
      status: "pending",
    }
  })

  const { data, error: dbError } = await supabase
    .from("orders")
    .insert(ordersToInsert)
    .select()

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
  return NextResponse.json({ ok: true, orders: data }, { status: 201 })
}
