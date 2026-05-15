import { NextResponse, type NextRequest } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/auth/guards"
import { generateQRCodePNG, buildQRUrl } from "@/lib/qr"
import { getConfig } from "@/lib/config"

export async function GET(_req: NextRequest, ctx: DynContext<"/api/tables/[id]/qr">) {
  const { error } = await requireAdmin()
  if (error) return error

  const { id } = await ctx.params
  const supabase = createServiceClient()
  const { data: table } = await supabase
    .from("tables")
    .select("qr_token, label")
    .eq("id", id)
    .single()

  if (!table) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const config = await getConfig()
  const url = buildQRUrl(config.qr_base_url, table.qr_token)
  const png = await generateQRCodePNG(url)

  return new NextResponse(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": `attachment; filename="qr-${table.label}.png"`,
    },
  })
}
