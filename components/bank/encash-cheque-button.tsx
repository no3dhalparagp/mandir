"use client"

import { useTransition } from "react"
import { toast } from "sonner"
import {
  CheckCircle2,
  Loader2,
} from "lucide-react"

import { encashChequeEntry } from "@/app/dashboard/collections/actions"

import { Button } from "@/components/ui/button"

interface Props {
  ledgerEntryId: string
}

export function EncashChequeButton({
  ledgerEntryId,
}: Props) {
  const [isPending, startTransition] =
    useTransition()

  const handleEncash = () => {
    startTransition(async () => {
      const result =
        await encashChequeEntry(
          ledgerEntryId
        )

      if (result.error) {
        toast.error(result.error)
        return
      }

      toast.success(
        "Cheque encashed successfully."
      )

      window.location.reload()
    })
  }

  return (
    <Button
      size="sm"
      onClick={handleEncash}
      disabled={isPending}
      className="bg-green-600 hover:bg-green-700 text-white"
    >
      {isPending ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Processing...
        </>
      ) : (
        <>
          <CheckCircle2 className="w-4 h-4 mr-2" />
          Encash
        </>
      )}
    </Button>
  )
}
