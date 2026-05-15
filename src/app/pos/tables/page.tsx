"use client"

import { useState } from "react"
import { useTables } from "@/hooks/useTables"
import { useConfig } from "@/hooks/useConfig"
import { TableCard } from "@/components/pos/TableCard"
import { ReservationList } from "@/components/pos/ReservationList"
import { BillingModeBadge } from "@/components/layout/BillingModeBadge"
import { PageHeader } from "@/components/layout/PageHeader"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { useReservations } from "@/hooks/useReservations"

export default function TablesPage() {
  const { data: tables, isLoading } = useTables()
  const { data: config } = useConfig()
  const { data: reservations = [] } = useReservations("booked")

  const now = new Date()
  const twoHoursLater = new Date(now.getTime() + 2 * 3_600_000)
  const upcomingCount = reservations.filter(
    (r) => new Date(r.datetime) >= now && new Date(r.datetime) <= twoHoursLater
  ).length

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <PageHeader title="Tables" />
        <BillingModeBadge />
      </div>

      {upcomingCount > 0 && (
        <div className="mb-4 px-4 py-2 bg-[rgba(59,130,246,0.1)] border border-[rgba(59,130,246,0.3)] rounded-xl text-sm text-[#3b82f6]">
          📅 {upcomingCount} reservation{upcomingCount > 1 ? "s" : ""} in the next 2 hours
        </div>
      )}

      <Tabs defaultValue="floor">
        <TabsList className="bg-[rgba(20,36,28,0.85)] border border-[rgba(255,255,255,0.08)] mb-4">
          <TabsTrigger value="floor" className="data-[state=active]:bg-[rgba(245,158,11,0.15)] data-[state=active]:text-[#f59e0b]">
            Floor
          </TabsTrigger>
          <TabsTrigger value="reservations" className="data-[state=active]:bg-[rgba(245,158,11,0.15)] data-[state=active]:text-[#f59e0b]">
            Reservations {upcomingCount > 0 && <span className="ml-1 text-xs bg-[#3b82f6] text-white rounded-full px-1.5">{upcomingCount}</span>}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="floor">
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-40 rounded-2xl bg-[rgba(40,56,44,0.4)]" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {(tables ?? []).map((table) => (
                <TableCard
                  key={table.id}
                  table={table}
                  currencySymbol={config?.currency_symbol ?? "Rp"}
                  billingMode={config?.billing_mode ?? "block_hour"}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="reservations">
          <ReservationList />
        </TabsContent>
      </Tabs>
    </div>
  )
}
