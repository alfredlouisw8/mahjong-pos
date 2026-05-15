import { NextResponse, type NextRequest } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"
import { requireAnyStaff } from "@/lib/auth/guards"

export async function GET(_req: NextRequest, ctx: DynContext<"/api/sessions/[id]">) {
  const { error } = await requireAnyStaff()
  if (error) return error

  const { id } = await ctx.params
  const supabase = createServiceClient()
  const { data, error: dbError } = await supabase
    .from("sessions")
    .select(`*, orders(*, menu_items(*)), tables(id, label), cashiers:opened_by(id, name)`)
    .eq("id", id)
    .single()

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 404 })
  return NextResponse.json(data)
}
