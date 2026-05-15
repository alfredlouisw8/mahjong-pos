import { NextResponse, type NextRequest } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/auth/guards"

export async function GET(request: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  const { searchParams } = new URL(request.url)
  const from = searchParams.get("from") ?? new Date().toISOString().split("T")[0]
  const to = searchParams.get("to") ?? new Date().toISOString().split("T")[0]

  const supabase = createServiceClient()
  const { data, error: dbError } = await supabase
    .from("orders")
    .select(`menu_item_id, quantity, unit_price, unit_cogs, menu_items(name, category)`)
    .eq("status", "confirmed")
    .gte("created_at", `${from}T00:00:00`)
    .lte("created_at", `${to}T23:59:59`)

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })

  const itemMap: Record<string, { name: string; category: string; qty: number; revenue: number; cogs: number }> = {}

  for (const order of data ?? []) {
    const key = order.menu_item_id
    if (!itemMap[key]) {
      itemMap[key] = {
        name: (order.menu_items as any)?.name ?? "Unknown",
        category: (order.menu_items as any)?.category ?? "",
        qty: 0, revenue: 0, cogs: 0,
      }
    }
    itemMap[key].qty += order.quantity
    itemMap[key].revenue += order.unit_price * order.quantity
    itemMap[key].cogs += order.unit_cogs * order.quantity
  }

  const items = Object.entries(itemMap)
    .map(([id, v]) => ({
      id,
      ...v,
      margin: v.revenue - v.cogs,
      marginPct: v.revenue > 0 ? ((v.revenue - v.cogs) / v.revenue) * 100 : 0,
    }))
    .sort((a, b) => b.revenue - a.revenue)

  return NextResponse.json(items)
}
