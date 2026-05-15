import { NextResponse, type NextRequest } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/auth/guards"

export async function GET(_req: NextRequest, ctx: DynContext<"/api/admin/menu/[id]/ingredients">) {
  const { error } = await requireAdmin()
  if (error) return error

  const { id } = await ctx.params
  const supabase = createServiceClient()
  const { data, error: dbError } = await supabase
    .from("menu_item_ingredients")
    .select(`*, inventory_items(*)`)
    .eq("menu_item_id", id)

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PUT(request: NextRequest, ctx: DynContext<"/api/admin/menu/[id]/ingredients">) {
  const { error } = await requireAdmin()
  if (error) return error

  const { id } = await ctx.params
  const ingredients = await request.json()
  const supabase = createServiceClient()

  await supabase.from("menu_item_ingredients").delete().eq("menu_item_id", id)

  if (ingredients.length) {
    const { error: dbError } = await supabase.from("menu_item_ingredients").insert(
      ingredients.map((ing: { inventoryItemId: string; quantityUsed: number }) => ({
        menu_item_id: id,
        inventory_item_id: ing.inventoryItemId,
        quantity_used: ing.quantityUsed,
      }))
    )
    if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
