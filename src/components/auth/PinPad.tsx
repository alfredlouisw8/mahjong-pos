"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Delete } from "lucide-react"

interface PinPadProps {
  onConfirm: (pin: string) => void
  loading?: boolean
}

export function PinPad({ onConfirm, loading }: PinPadProps) {
  const [pin, setPin] = useState("")
  const MAX_PIN = 6

  const append = (digit: string) => {
    if (pin.length < MAX_PIN) setPin((p) => p + digit)
  }

  const backspace = () => setPin((p) => p.slice(0, -1))

  const confirm = () => {
    if (pin.length > 0) onConfirm(pin)
  }

  const digits = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"]

  return (
    <div className="space-y-4">
      <div className="flex justify-center gap-3 h-8">
        {Array.from({ length: MAX_PIN }).map((_, i) => (
          <div
            key={i}
            className={`w-3 h-3 rounded-full mt-auto ${
              i < pin.length ? "bg-[#f59e0b]" : "bg-[rgba(255,255,255,0.2)]"
            }`}
          />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-3">
        {digits.slice(0, 9).map((d) => (
          <Button
            key={d}
            variant="outline"
            className="h-14 text-xl font-medium bg-[rgba(40,56,44,0.6)] border-[rgba(255,255,255,0.08)] hover:bg-[rgba(245,158,11,0.15)] hover:border-[rgba(251,191,36,0.25)] hover:text-[#f59e0b]"
            onClick={() => append(d)}
          >
            {d}
          </Button>
        ))}
        <Button
          variant="outline"
          className="h-14 bg-[rgba(40,56,44,0.6)] border-[rgba(255,255,255,0.08)] hover:bg-red-900/30"
          onClick={backspace}
        >
          <Delete size={18} />
        </Button>
        <Button
          variant="outline"
          className="h-14 text-xl bg-[rgba(40,56,44,0.6)] border-[rgba(255,255,255,0.08)]"
          onClick={() => append("0")}
        >
          0
        </Button>
        <Button
          className="h-14 bg-[#f59e0b] hover:bg-[#d97706] text-black font-bold"
          onClick={confirm}
          disabled={pin.length === 0 || loading}
        >
          ✓
        </Button>
      </div>
    </div>
  )
}
