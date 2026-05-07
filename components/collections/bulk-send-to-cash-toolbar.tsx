"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"

import { bulkAddVerifiedCollectionsToCashAccount } from "@/app/dashboard/bank/actions"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type CashAccount = {
  id: string
  name: string
  accountType: string
}

type Props = {
  cashAccounts: CashAccount[]
  selectedIds: string[]
  onCompleted?: () => void
}

export function BulkSendToCashToolbar({
  cashAccounts,
  selectedIds,
  onCompleted,
}: Props) {
  const [cashAccountId, setCashAccountId] = useState<string | undefined>(
    cashAccounts[0]?.id
  )
  const [isPending, startTransition] = useTransition()

  const hasSelection = selectedIds.length > 0
  const hasCashAccount = cashAccounts.length > 0

  const handleSend = () => {
    if (!cashAccountId || !hasSelection) return

    startTransition(async () => {
      const result = await bulkAddVerifiedCollectionsToCashAccount({
        cashAccountId,
        collectionIds: selectedIds,
      })

      if ("error" in result && result.error) {
        toast.error(result.error)
        return
      }

      toast.success("Collections sent to cash account successfully.")
      onCompleted?.()
    })
  }

  if (!hasCashAccount) {
    return (
      <p className="text-xs text-red-600">
        No Cash in Hand account found. Please create one under Bank Accounts to
        send verified collections to cash.
      </p>
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select
        value={cashAccountId}
        onValueChange={(val) => setCashAccountId(val)}
      >
        <SelectTrigger className="w-[220px]">
          <SelectValue placeholder="Select cash account" />
        </SelectTrigger>
        <SelectContent>
          {cashAccounts.map((acc) => (
            <SelectItem key={acc.id} value={acc.id}>
              {acc.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button
        size="sm"
        onClick={handleSend}
        disabled={!hasSelection || !cashAccountId || isPending}
      >
        {isPending ? "Sending..." : `Send ${selectedIds.length} to Cash`}
      </Button>
    </div>
  )
}

