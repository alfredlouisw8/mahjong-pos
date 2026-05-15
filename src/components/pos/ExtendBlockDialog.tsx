"use client"

import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { fmtMoney } from "@/lib/formatters"
import type { Session } from "@/types/database"

interface ExtendBlockDialogProps {
  session: Session
  currencySymbol: string
  onClose: () => void
}

export function ExtendBlockDialog({ session, currencySymbol, onClose }: ExtendBlockDialogProps) {
  const [blocks, setBlocks] = useState(1)
  const queryClient = useQueryClient()

  const extend = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/sessions/${session.id}/extend`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blocks }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tables"] })
      toast.success(`Extended by ${blocks} block${blocks > 1 ? "s" : ""}`)
      onClose()
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const addedCharge = blocks * session.hourly_rate

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="bg-[rgba(20,36,28,0.95)] border-[rgba(255,255,255,0.08)] text-[#fef9ec]">
        <DialogHeader>
          <DialogTitle className="text-[#f59e0b]">Extend Session</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-[rgba(251,191,36,0.55)]">Add more 1-hour blocks</p>
          <div className="flex items-center gap-4 justify-center">
            <Button
              variant="outline"
              onClick={() => setBlocks(Math.max(1, blocks - 1))}
              className="h-10 w-10 text-lg border-[rgba(255,255,255,0.08)]"
            >−</Button>
            <span className="text-3xl font-bold w-12 text-center">{blocks}</span>
            <Button
              variant="outline"
              onClick={() => setBlocks(blocks + 1)}
              className="h-10 w-10 text-lg border-[rgba(255,255,255,0.08)]"
            >+</Button>
          </div>
          <div className="text-center">
            <p className="text-sm text-[rgba(251,191,36,0.55)]">Additional charge</p>
            <p className="text-2xl font-bold text-[#f59e0b] font-tabular">
              {fmtMoney(addedCharge, currencySymbol)}
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1 border-[rgba(255,255,255,0.08)]">
              Cancel
            </Button>
            <Button
              onClick={() => extend.mutate()}
              disabled={extend.isPending}
              className="flex-1 bg-[#f59e0b] hover:bg-[#d97706] text-black font-bold"
            >
              Extend +{fmtMoney(addedCharge, currencySymbol)}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
