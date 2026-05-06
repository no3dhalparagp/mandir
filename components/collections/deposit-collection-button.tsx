"use client"

import * as React from "react"
import { Loader2, Send } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { markCollectionDeposited } from "@/app/dashboard/collections/actions"

export function DepositCollectionButton({
  collectionId,
  accounts,
}: {
  collectionId: string
  accounts: { id: string; name: string }[]
}) {
  const [open, setOpen] = React.useState(false)
  const [pending, startTransition] = React.useTransition()
  const [accountId, setAccountId] = React.useState("")
  const [depositSlipNo, setDepositSlipNo] = React.useState("")

  function handleDeposit(e: React.FormEvent) {
    e.preventDefault()
    if (!accountId) {
      toast.error("Please select a target account")
      return
    }

    startTransition(async () => {
      const res = await markCollectionDeposited(collectionId, accountId, depositSlipNo || undefined)
      if (res.error) toast.error(res.error)
      else {
        toast.success("Marked as deposited!")
        setOpen(false)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" variant="outline" className="gap-2" />}>
        <Send className="h-3.5 w-3.5 text-blue-600" /> Deposit
      </DialogTrigger>
      <DialogContent className="sm:max-w-[360px]">
        <DialogHeader>
          <DialogTitle>Deposit Collection</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleDeposit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label>Deposit To Account *</Label>
            <Select onValueChange={(v) => setAccountId(v as string)} required>
              <SelectTrigger><SelectValue placeholder="Select account" /></SelectTrigger>
              <SelectContent>
                {accounts.map((a) => (
                  <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Deposit Slip / Ref No.</Label>
            <Input 
              value={depositSlipNo} 
              onChange={(e) => setDepositSlipNo(e.target.value)} 
              placeholder="Optional" 
            />
          </div>
          <Button type="submit" className="w-full" disabled={pending || !accountId}>
            {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Submit Deposit
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
