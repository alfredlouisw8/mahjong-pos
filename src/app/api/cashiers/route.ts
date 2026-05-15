import { NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"

export async function GET() {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from("cashiers")
    .select("id, name, is_active, pin_hash")
    .eq("is_active", true)
    .order("name")

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
