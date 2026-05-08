"use client"

import { Suspense } from "react"
import { DevoteesListComponent } from "@/components/mandir/devotees-list"

export default function DevoteesPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Devotees</h1>
        <p className="text-muted-foreground">Manage devotees and track their contributions</p>
      </div>
      <Suspense fallback={<div className="text-center py-8">Loading devotees...</div>}>
        <DevoteesListComponent />
      </Suspense>
    </div>
  )
}
