import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { verifyCashierToken } from "./cashier"
import { createAuthClient } from "@/lib/supabase/auth-server"
import type { CashierTokenPayload } from "@/types/api"

export async function getAdminUser() {
  const supabase = await createAuthClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}

export async function requireAdmin() {
  const user = await getAdminUser()
  if (!user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }), user: null }
  }
  return { error: null, user }
}

export async function getCashierFromCookie(): Promise<CashierTokenPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get("cashier_token")?.value
  if (!token) return null
  return verifyCashierToken(token)
}

export async function requireCashier() {
  const payload = await getCashierFromCookie()
  if (!payload) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }), payload: null }
  }
  return { error: null, payload }
}

export async function requireAnyStaff() {
  const cashier = await getCashierFromCookie()
  if (cashier) return { error: null, cashier, isAdmin: false }

  const user = await getAdminUser()
  if (user) return { error: null, cashier: null, isAdmin: true }

  return {
    error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    cashier: null,
    isAdmin: false,
  }
}
