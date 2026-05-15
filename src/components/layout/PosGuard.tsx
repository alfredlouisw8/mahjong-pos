"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useShiftStore } from "@/store/shift"

export function PosGuard({ isAdmin }: { isAdmin: boolean }) {
  const router = useRouter()
  const { shiftId } = useShiftStore()

  useEffect(() => {
    if (!isAdmin && !shiftId) {
      router.replace("/")
    }
  }, [isAdmin, shiftId, router])

  return null
}
