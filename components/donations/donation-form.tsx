"use client"

import * as React from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2 } from "lucide-react"
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
import { Separator } from "@/components/ui/separator"
import { createDonation } from "@/app/dashboard/donations/actions"

// ------------------------------------------------------------------
// Constants
// ------------------------------------------------------------------
const CATEGORIES = [
  "GENERAL",
  "PUJA",
  "FESTIVAL",
  "CONSTRUCTION",
  "ANNADAN",
  "SPECIAL",
  "SEWA",
  "TRUST_FUND",
] as const

const PAYMENT_MODES = [
  "CASH",
  "CHEQUE",
  "DD",
  "UPI",
  "NEFT",
  "RTGS",
  "IMPS",
] as const

// ------------------------------------------------------------------
// Schema
// ------------------------------------------------------------------
const donationSchema = z
  .object({
    donorName: z.string().min(2, "Name is required."),
    mobileNumber: z.string().optional(),
    address: z.string().optional(),
    category: z.enum(CATEGORIES),
    amount: z
      .number({ error: "Amount is required" })
      .min(1, "Amount must be positive"),
    paymentMode: z.enum(PAYMENT_MODES),
    transactionId: z.string().optional(),
    chequeNumber: z.string().optional(),
    chequeDate: z.string().optional(),
    bankNameCheque: z.string().optional(),
    accountId: z.string().optional(),
    collectedByMemberId: z.string().optional(),
    notes: z.string().optional(),
  })
  .refine(
    (data) => data.accountId || data.collectedByMemberId,
    {
      message: "Either select a Deposit Account or a Collected by Member.",
      path: ["accountId", "collectedByMemberId"],
    }
  )
  .refine(
    (data) => {
      // For CASH payments by non-admin users, a collector is required
      // because they cannot deposit to an account.
      return !(
        data.paymentMode === "CASH" &&
        !data.accountId && // no account selected (disabled anyway)
        !data.collectedByMemberId
      )
    },
    {
      message: "Please select a collector for cash payments.",
      path: ["collectedByMemberId"],
    }
  )

type DonationFormData = z.infer<typeof donationSchema>

interface DonationFormProps {
  onSuccess: () => void
  accounts: { id: string; name: string; accountType?: string }[]
  collectors: { id: string; name: string; memberId: string }[]
  loggedInMemberId?: string
  isAdminOrAccountant?: boolean | null
}

export function DonationForm({
  onSuccess,
  accounts,
  collectors,
  loggedInMemberId,
  isAdminOrAccountant,
}: DonationFormProps) {
  const [isPending, startTransition] = React.useTransition()
  const isAdmin = !!isAdminOrAccountant // treat null/undefined as false

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<DonationFormData>({
    resolver: zodResolver(donationSchema),
    defaultValues: {
      category: "GENERAL",
      paymentMode: "CASH",
      collectedByMemberId: loggedInMemberId || undefined,
    },
  })

  const watchedPaymentMode = watch("paymentMode")
  const isCASH = watchedPaymentMode === "CASH"
  const showChequeFields = watchedPaymentMode === "CHEQUE" || watchedPaymentMode === "DD"
  const showTxnField = ["UPI", "NEFT", "RTGS", "IMPS"].includes(watchedPaymentMode)

  // Reset account selection when payment mode changes, and auto‑set collector for cash
  React.useEffect(() => {
    setValue("accountId", "")
    if (isCASH && !isAdmin && loggedInMemberId) {
      setValue("collectedByMemberId", loggedInMemberId)
    }
  }, [watchedPaymentMode, isCASH, isAdmin, loggedInMemberId, setValue])

  // Memoized account list based on payment mode and role
  const filteredAccounts = React.useMemo(
    () =>
      accounts.filter((a) => {
        if (isCASH) {
          // Only cash‑in‑hand accounts, and only admins/accountants can deposit
          if (!isAdmin) return false
          return a.accountType === "CASH_IN_HAND"
        }
        // For non‑cash, show bank accounts (not cash book)
        return a.accountType !== "CASH_IN_HAND"
      }),
    [accounts, isCASH, isAdmin]
  )

  const disableDepositAccount = isCASH && !isAdmin

  function onSubmit(data: DonationFormData) {
    startTransition(async () => {
      const result = await createDonation(data)
      if (result.error) toast.error(result.error)
      else {
        toast.success("Donation added successfully!")
        onSuccess()
      }
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
      {/* Donor Details */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="donorName">Donor Name *</Label>
          <Input id="donorName" {...register("donorName")} />
          {errors.donorName && (
            <p className="text-xs text-destructive">{errors.donorName.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="mobileNumber">Mobile Number</Label>
          <Input id="mobileNumber" {...register("mobileNumber")} />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="address">Address</Label>
        <Input id="address" {...register("address")} />
      </div>

      <Separator />

      {/* Payment Details */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Controller
            name="category"
            control={control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger id="category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat.charAt(0) + cat.slice(1).toLowerCase().replace("_", " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="amount">Amount (₹) *</Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            {...register("amount", { valueAsNumber: true })}
          />
          {errors.amount && (
            <p className="text-xs text-destructive">{errors.amount.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="paymentMode">Payment Mode</Label>
          <Controller
            name="paymentMode"
            control={control}
            render={({ field }) => (
              <Select
                onValueChange={field.onChange}
                value={field.value}
              >
                <SelectTrigger id="paymentMode">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CASH">Cash</SelectItem>
                  <SelectItem value="CHEQUE">Cheque</SelectItem>
                  {isAdmin && (
                    <>
                      <SelectItem value="UPI">UPI</SelectItem>
                      <SelectItem value="NEFT">NEFT</SelectItem>
                      <SelectItem value="RTGS">RTGS</SelectItem>
                      <SelectItem value="IMPS">IMPS</SelectItem>
                      <SelectItem value="DD">Demand Draft</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            )}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="accountId">
            Deposit to Account {disableDepositAccount ? "(Not available for cash)" : ""}
          </Label>
          <Controller
            name="accountId"
            control={control}
            render={({ field }) => (
              <Select
                onValueChange={(v) => field.onChange(v === "__none" ? "" : v)}
                value={field.value || "__none"}
                disabled={disableDepositAccount}
              >
                <SelectTrigger id="accountId">
                  <SelectValue
                    placeholder={disableDepositAccount ? "N/A" : "Select account…"}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none">— Direct —</SelectItem>
                  {filteredAccounts.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.accountId && (
            <p className="text-xs text-destructive">{errors.accountId.message}</p>
          )}
        </div>
      </div>

      {/* Cheque Fields */}
      {showChequeFields && (
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="chequeNumber">Cheque No.</Label>
            <Input id="chequeNumber" {...register("chequeNumber")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="chequeDate">Cheque Date</Label>
            <Input id="chequeDate" type="date" {...register("chequeDate")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bankNameCheque">Bank Name</Label>
            <Input id="bankNameCheque" {...register("bankNameCheque")} />
          </div>
        </div>
      )}

      {/* Transaction ID for UPI / NEFT / RTGS */}
      {showTxnField && (
        <div className="space-y-2">
          <Label htmlFor="transactionId">Transaction / Reference ID</Label>
          <Input
            id="transactionId"
            {...register("transactionId")}
            placeholder="UTR / Ref Number"
          />
        </div>
      )}

      <Separator />

      {/* Collected by Member */}
      <div className="space-y-2">
        <Label htmlFor="collectedByMemberId">Collected by Member (optional)</Label>
        <Controller
          name="collectedByMemberId"
          control={control}
          render={({ field }) => (
            <Select
              onValueChange={(v) => field.onChange(v === "__none" ? "" : v)}
              value={field.value || "__none"}
              disabled={!!loggedInMemberId && !isAdmin}
            >
              <SelectTrigger id="collectedByMemberId">
                <SelectValue placeholder="Direct receipt (not via member)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none">— Direct Receipt —</SelectItem>
                {collectors.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name} ({m.memberId})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        <p className="text-xs text-muted-foreground">
          {!!loggedInMemberId && !isAdmin
            ? "Your member profile is automatically selected for cash collection."
            : "If collected by a member, it will need accountant verification before entering the Cash Book."}
        </p>
        {errors.collectedByMemberId && (
          <p className="text-xs text-destructive">
            {errors.collectedByMemberId.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Input id="notes" {...register("notes")} />
      </div>

      <Button className="w-full" type="submit" disabled={isPending}>
        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Save Donation
      </Button>
    </form>
  )
}
