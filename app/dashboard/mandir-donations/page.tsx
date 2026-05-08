"use client"

import { Suspense } from "react"
import { MandiDonationsListComponent } from "@/components/mandir/mandir-donations-list"

export default function MandiDonationsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Mandir Donations</h1>
        <p className="text-muted-foreground">Track donations for specific Mandir causes</p>
      </div>
      <Suspense fallback={<div className="text-center py-8">Loading donations...</div>}>
        <MandiDonationsListComponent />
      </Suspense>
    </div>
  )
}
