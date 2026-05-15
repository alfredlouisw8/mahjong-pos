import { NextResponse, type NextRequest } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/auth/guards"
import { getConfig } from "@/lib/config"

export async function GET() {
  const config = await getConfig()
  return NextResponse.json(config)
}

export async function PATCH(request: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  const body = await request.json()
  const supabase = createServiceClient()

  const upserts = Object.entries(body).map(([key, value]) => ({
    key,
    value: String(value),
  }))

  const { error: dbError } = await supabase
    .from("config")
    .upsert(upserts, { onConflict: "key" })

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
  const updated = await getConfig()
  return NextResponse.json(updated)
}
