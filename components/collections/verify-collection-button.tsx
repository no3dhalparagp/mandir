// components/collections/verify-collection-button.tsx
"use client"

import { useState } from "react"
import { verifyCollection } from "@/app/dashboard/collections/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export function VerifyCollectionButton({
  collectionId,
  collectedAmount,
}: {
  collectionId: string
  collectedAmount: number
}) {
  const [verifiedAmount, setVerifiedAmount] = useState(collectedAmount)
  const [note, setNote] = useState("")
  const [loading, setLoading] = useState(false)

  const handleVerify = async () => {
    setLoading(true)
    const res = await verifyCollection(collectionId, verifiedAmount, note)
    if (res.error) {
      alert(res.error)
    }
    setLoading(false)
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">Verify</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Verify Collection</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label>Amount Collected: ₹{collectedAmount}</label>
            <Input
              type="number"
              value={verifiedAmount}
              onChange={(e) => setVerifiedAmount(parseFloat(e.target.value))}
            />
          </div>
          <div>
            <label>Note (if discrepancy):</label>
            <Input value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
          <Button onClick={handleVerify} disabled={loading}>
            {loading ? "Verifying..." : "Confirm Verification"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
