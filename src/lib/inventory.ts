import type { SupabaseClient } from "@supabase/supabase-js"

export async function deductInventoryForOrder(
  supabase: SupabaseClient,
  orderId: string,
  menuItemId: string,
  quantity: number,
  recordedBy: string | null = null
): Promise<{ lowStockItems: string[] }> {
  const lowStockItems: string[] = []

  const { data: ingredients } = await supabase
    .from("menu_item_ingredients")
    .select("*, inventory_items(*)")
    .eq("menu_item_id", menuItemId)

  if (!ingredients?.length) return { lowStockItems }

  for (const ingredient of ingredients) {
    const deduct = ingredient.quantity_used * quantity
    const item = ingredient.inventory_items as any

    const newStock = (item?.current_stock ?? 0) - deduct

    await supabase
      .from("inventory_items")
      .update({ current_stock: newStock, updated_at: new Date().toISOString() })
      .eq("id", ingredient.inventory_item_id)

    await supabase.from("inventory_movements").insert({
      inventory_item_id: ingredient.inventory_item_id,
      action: "consumed",
      quantity: -deduct,
      reference_id: orderId,
      notes: `Order ${orderId}`,
      recorded_by: recordedBy,
    })

    if (newStock <= (item?.low_stock_threshold ?? 5)) {
      lowStockItems.push(item?.name ?? ingredient.inventory_item_id)
    }
  }

  return { lowStockItems }
}
