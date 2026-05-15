import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import type { CashierTokenPayload } from "@/types/api"

const JWT_SECRET = process.env.CASHIER_JWT_SECRET!

export async function verifyCashierPin(
  pinHash: string | null,
  pin: string
): Promise<boolean> {
  if (!pinHash) return true
  return bcrypt.compare(pin, pinHash)
}

export function signCashierToken(payload: CashierTokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "12h" })
}

export function verifyCashierToken(token: string): CashierTokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as CashierTokenPayload
  } catch {
    return null
  }
}
