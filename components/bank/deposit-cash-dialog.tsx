"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2, ArrowUpCircle } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

import { createFundTransfer } from "@/app/dashboard/bank/transfers/actions"

const schema = z.object({
  fromAccountId: z.string().min(1, "Select source cash account"),
  toAccountId: z.string().min(1, "Select target bank account"),
  amount: z.coerce.number().min(1, "Amount must be greater than 0"),
  referenceNo: z.string().optional(),
  notes: z.string().optional(),
})

// Use input type for RHF
type FormData = z.input<typeof schema>

interface Account {
  id: string
  name: string
  accountType: string
  currentBalance?: number
}

interface DepositCashDialogProps {
  accounts: Account[]
}

export function DepositCashDialog({
  accounts,
}: DepositCashDialogProps) {
  const [open, setOpen] = React.useState(false)
  const [pending, startTransition] = React.useTransition()

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      fromAccountId: "",
      toAccountId: "",
      amount: 0,
      referenceNo: "",
      notes: "",
    },
  })

  // Filter account types
  const cashAccounts = accounts.filter(
    (a) => a.accountType === "CASH_IN_HAND"
  )

  const bankAccounts = accounts.filter(
    (a) => a.accountType !== "CASH_IN_HAND"
  )

  const cannotSubmit =
    cashAccounts.length === 0 || bankAccounts.length === 0

  const onSubmit = async (data: FormData) => {
    startTransition(async () => {
      try {
        const res = await createFundTransfer({
          ...data,
          amount: Number(data.amount),
        })

        if (res?.error) {
          toast.error(res.error)
          return
        }

        toast.success("Cash deposited successfully!")

        reset({
          fromAccountId: "",
          toAccountId: "",
          amount: 0,
          referenceNo: "",
          notes: "",
        })

        setOpen(false)

        window.location.reload()
      } catch (error) {
        console.error(error)
        toast.error("Something went wrong")
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <Button variant="outline" className="gap-2">
          <ArrowUpCircle className="h-4 w-4 text-green-600" />
          Deposit Cash
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>
            Deposit Cash to Bank
          </DialogTitle>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4 mt-2"
        >
          {/* From Cash Account */}
          <div className="space-y-2">
            <Label>From Cash Account *</Label>

            <Select
              onValueChange={(v) => {
                if (v) {
                  setValue("fromAccountId", v)
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select cash account" />
              </SelectTrigger>

              <SelectContent>
                {cashAccounts.length === 0 ? (
                  <SelectItem value="__none" disabled>
                    No cash accounts found
                  </SelectItem>
                ) : (
                  cashAccounts.map((a) => (
                    <SelectItem
                      key={a.id}
                      value={a.id}
                    >
                      {a.name} (
                      Bal: ₹
                      {a.currentBalance?.toLocaleString(
                        "en-IN"
                      ) || "0"}
                      )
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>

            {errors.fromAccountId && (
              <p className="text-xs text-destructive">
                {errors.fromAccountId.message}
              </p>
            )}
          </div>

          {/* To Bank Account */}
          <div className="space-y-2">
            <Label>Deposit To Bank Account *</Label>

            <Select
              onValueChange={(v) => {
                if (v) {
                  setValue("toAccountId", v)
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select bank account" />
              </SelectTrigger>

              <SelectContent>
                {bankAccounts.length === 0 ? (
                  <SelectItem value="__none" disabled>
                    No bank accounts found
                  </SelectItem>
                ) : (
                  bankAccounts.map((a) => (
                    <SelectItem
                      key={a.id}
                      value={a.id}
                    >
                      {a.name} (
                      Bal: ₹
                      {a.currentBalance?.toLocaleString(
                        "en-IN"
                      ) || "0"}
                      )
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>

            {errors.toAccountId && (
              <p className="text-xs text-destructive">
                {errors.toAccountId.message}
              </p>
            )}
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label>Amount (₹) *</Label>

            <Input
              type="number"
              step="0.01"
              min="1"
              {...register("amount")}
            />

            {errors.amount && (
              <p className="text-xs text-destructive">
                {errors.amount.message}
              </p>
            )}
          </div>

          {/* Reference */}
          <div className="space-y-2">
            <Label>
              Deposit Slip / Reference No.
            </Label>

            <Input
              placeholder="Optional"
              {...register("referenceNo")}
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notes</Label>

            <Input
              placeholder="Optional"
              {...register("notes")}
            />
          </div>

          {/* Submit */}
          <Button
            type="submit"
            className="w-full"
            disabled={pending || cannotSubmit}
          >
            {pending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}

            Submit Deposit
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
