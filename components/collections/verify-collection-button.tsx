"use client"

import * as React from "react"
import { Loader2, ShieldCheck } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { verifyCollection } from "@/app/dashboard/collections/actions"

export function VerifyCollectionButton({
  collectionId,
  collectedAmount,
}: {
  collectionId: string
  collectedAmount: number
}) {
  const [open, setOpen] = React.useState(false)
  const [pending, startTransition] = React.useTransition()
  const [verifiedAmount, setVerifiedAmount] = React.useState(collectedAmount)
  const [note, setNote] = React.useState("")

  function handleVerify() {
    startTransition(async () => {
      const res = await verifyCollection(collectionId, verifiedAmount, note || undefined)
      if (res.error) toast.error(res.error)
      else {
        if (verifiedAmount === collectedAmount && res.balance !== undefined) {
          toast.success(`Collection verified! ${res.accountName || 'Account'} balance: ₹${res.balance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`)
        } else {
          toast.success(verifiedAmount === collectedAmount ? "Collection verified!" : "Discrepancy noted.")
        }
        setOpen(false)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" variant="outline" />}>
        <ShieldCheck className="h-3.5 w-3.5 mr-1" /> Verify
      </DialogTrigger>
      <DialogContent className="sm:max-w-[360px]">
        <DialogHeader>
          <DialogTitle>Verify Collection</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div className="rounded-lg bg-muted p-3">
            <p className="text-xs text-muted-foreground">Amount collected by member</p>
            <p className="text-xl font-bold">
              ₹{collectedAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="space-y-2">
            <Label>Verified Amount (₹)</Label>
            <Input
              type="number"
              step="0.01"
              value={verifiedAmount}
              onChange={(e) => setVerifiedAmount(Number(e.target.value))}
            />
          </div>
          {verifiedAmount !== collectedAmount && (
            <div className="space-y-2">
              <Label>Discrepancy Note</Label>
              <Input
                placeholder="Reason for mismatch..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
          )}
          <Button onClick={handleVerify} className="w-full" disabled={pending}>
            {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirm Verification
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
