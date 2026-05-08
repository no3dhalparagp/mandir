"use client"

import { Suspense } from "react"
import { PujaRequestsListComponent } from "@/components/mandir/puja-requests-list"

export default function PujaRequestsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Puja Requests</h1>
        <p className="text-muted-foreground">View and manage puja requests from devotees</p>
      </div>
      <Suspense fallback={<div className="text-center py-8">Loading puja requests...</div>}>
        <PujaRequestsListComponent />
      </Suspense>
    </div>
  )
}
