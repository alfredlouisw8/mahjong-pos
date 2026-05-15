import { NextResponse, type NextRequest } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/auth/guards"

export async function POST(_req: NextRequest, ctx: DynContext<"/api/tables/[id]/qr/regenerate">) {
  const { error } = await requireAdmin()
  if (error) return error

  const { id } = await ctx.params
  const supabase = createServiceClient()

  const { data, error: dbError } = await supabase.rpc("gen_random_bytes_hex")
  const newToken = data ?? crypto.randomUUID().replace(/-/g, "")

  const { data: updated, error: updateError } = await supabase
    .from("tables")
    .update({
      qr_token: newToken,
      qr_generated_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single()

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })
  return NextResponse.json(updated)
}
