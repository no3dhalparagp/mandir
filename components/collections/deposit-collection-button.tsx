
"use client"

import { useState } from "react"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

import { Button } from "@/components/ui/button"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { Input } from "@/components/ui/input"

import { Label } from "@/components/ui/label"

import { Loader2 } from "lucide-react"

import { markCollectionDeposited } from "@/app/dashboard/collections/actions"

interface Props {
  collectionId: string

  accounts: {
    id: string
    name: string
  }[]

  recollectMode?: boolean
  recollectAmount?: number
}

export function DepositCollectionButton({
  collectionId,
  accounts,
  recollectMode = false,
  recollectAmount,
}: Props) {
  const [open, setOpen] =
    useState(false)

  const [loading, setLoading] =
    useState(false)

  const [accountId, setAccountId] =
    useState<string>("")

  const [
    depositSlipNo,
    setDepositSlipNo,
  ] = useState<string>("")

  /* =====================================================
     SUBMIT
  ===================================================== */

  async function handleSubmit() {
    if (!accountId) return

    try {
      setLoading(true)

      const result =
        await markCollectionDeposited(
          collectionId,
          accountId,
          depositSlipNo,
          recollectMode
        )

      if (result?.success) {
        setOpen(false)

        setAccountId("")
        setDepositSlipNo("")
      } else {
        alert(
          result?.error ??
            "Something went wrong"
        )
      }
    } catch (error) {
      console.error(error)

      alert("Failed to submit")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
    >
      <DialogTrigger>
        <Button
          size="sm"
          variant={
            recollectMode
              ? "destructive"
              : "default"
          }
        >
          {recollectMode
            ? "Recollect"
            : "Deposit"}
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {recollectMode
              ? "Recollect Collection"
              : "Deposit Collection"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {recollectMode && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              Remaining amount to recollect:{" "}
              <span className="font-semibold">
                ₹
                {(recollectAmount ?? 0).toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                })}
              </span>
            </div>
          )}

          {/* ============================================
              ACCOUNT SELECT
          ============================================ */}

          <div className="space-y-2">
            <Label>
              Select Account
            </Label>

            <Select
              value={accountId}
              onValueChange={(
                value
              ) => {
                setAccountId(
                  value ?? ""
                )
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose account" />
              </SelectTrigger>

              <SelectContent>
                {accounts.length ===
                0 ? (
                  <SelectItem
                    value="NO_ACCOUNT"
                    disabled
                  >
                    No account found
                  </SelectItem>
                ) : (
                  accounts.map((a) => (
                    <SelectItem
                      key={a.id}
                      value={a.id}
                    >
                      {a.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* ============================================
              DEPOSIT SLIP
          ============================================ */}

          <div className="space-y-2">
            <Label>
              Deposit Slip No
            </Label>

            <Input
              placeholder="Optional"
              value={depositSlipNo}
              onChange={(e) =>
                setDepositSlipNo(
                  e.target.value
                )
              }
            />
          </div>

          {/* ============================================
              SUBMIT BUTTON
          ============================================ */}

          <Button
            className="w-full"
            disabled={
              loading || !accountId
            }
            onClick={handleSubmit}
            variant={
              recollectMode
                ? "destructive"
                : "default"
            }
          >
            {loading && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}

            {recollectMode
              ? "Submit Recollection"
              : "Submit Deposit"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

