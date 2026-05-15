import { ReservationList } from "@/components/pos/ReservationList"
import { PageHeader } from "@/components/layout/PageHeader"

export default function ReservationsPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader title="Reservations" />
      <ReservationList />
    </div>
  )
}
