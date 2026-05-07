"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { createDonation } from "@/app/dashboard/donations/actions"

const donationSchema = z.object({
  donorName: z.string().min(2, "Name is required."),
  mobileNumber: z.string().optional(),
  address: z.string().optional(),
  category: z.enum([
    "GENERAL",
    "PUJA",
    "FESTIVAL",
    "CONSTRUCTION",
    "ANNADAN",
    "SPECIAL",
    "SEWA",
    "TRUST_FUND",
  ]),
  amount: z.number({ error: "Amount is required" }).min(1, "Amount must be positive"),
  paymentMode: z.enum([
    "CASH",
    "CHEQUE",
    "DD",
    "UPI",
    "NEFT",
    "RTGS",
    "IMPS",
  ]),
  transactionId: z.string().optional(),
  chequeNumber: z.string().optional(),
  chequeDate: z.string().optional(),
  bankNameCheque: z.string().optional(),
  accountId: z.string().optional(),
  collectedByMemberId: z.string().optional(),
  notes: z.string().optional(),
}).refine(data => data.accountId || data.collectedByMemberId, {
  message: "Either select a Deposit Account or a Collected by Member.",
  path: ["accountId"],
})

type DonationFormData = z.infer<typeof donationSchema>

interface DonationFormProps {
  onSuccess: () => void
  accounts: { id: string; name: string; accountType?: string }[]
  collectors: { id: string; name: string; memberId: string }[]
  loggedInMemberId?: string
  isAdminOrAccountant?: boolean | null
}

export function DonationForm({ onSuccess, accounts, collectors, loggedInMemberId, isAdminOrAccountant }: DonationFormProps) {
  const [isPending, startTransition] = React.useTransition()
  const [paymentMode, setPaymentMode] = React.useState("CASH")

  const {
    register, handleSubmit, setValue, formState: { errors },
  } = useForm<DonationFormData>({
    resolver: zodResolver(donationSchema),
    defaultValues: { 
      category: "GENERAL", 
      paymentMode: "CASH",
      collectedByMemberId: loggedInMemberId || undefined
    },
  })

  function onSubmit(data: DonationFormData) {
    startTransition(async () => {
      const result = await createDonation(data)
      if (result.error) toast.error(result.error)
      else { toast.success("Donation added successfully!"); onSuccess() }
    })
  }

  const showChequeFields = paymentMode === "CHEQUE" || paymentMode === "DD"
  const showTxnField = ["UPI", "NEFT", "RTGS", "IMPS"].includes(paymentMode)
  const isCASH = paymentMode === "CASH"

  React.useEffect(() => {
    // Reset account ID when payment mode changes because the available accounts change
    setValue("accountId", "")
    
    // Auto-assign member collection if it's a standard member receiving cash
    if (paymentMode === "CASH" && !isAdminOrAccountant && loggedInMemberId) {
      setValue("collectedByMemberId", loggedInMemberId)
    }
  }, [paymentMode, isAdminOrAccountant, loggedInMemberId, setValue])

  // Filter accounts based on payment mode and role
  const filteredAccounts = accounts.filter(a => {
    if (isCASH) {
      // For CASH, only show CASH_IN_HAND accounts (Cash Book)
      // And only Admins/Accountants can deposit directly to Cash Book
      if (!isAdminOrAccountant) return false
      return a.accountType === "CASH_IN_HAND"
    } else {
      // For online payments, show bank accounts (not cash book)
      return a.accountType !== "CASH_IN_HAND"
    }
  })

  // Disable account selection if it's CASH and standard member
  const disableDepositAccount = isCASH && !isAdminOrAccountant

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
      {/* Donor Details */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Donor Name *</Label>
          <Input {...register("donorName")} />
          {errors.donorName && <p className="text-xs text-destructive">{errors.donorName.message}</p>}
        </div>
        <div className="space-y-2">
          <Label>Mobile Number</Label>
          <Input {...register("mobileNumber")} />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Address</Label>
        <Input {...register("address")} />
      </div>

      <Separator />

      {/* Payment Details */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Category</Label>
          <Select onValueChange={(v) => setValue("category", v as DonationFormData["category"])} defaultValue="GENERAL">
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="GENERAL">General</SelectItem>
              <SelectItem value="PUJA">Puja</SelectItem>
              <SelectItem value="FESTIVAL">Festival</SelectItem>
              <SelectItem value="CONSTRUCTION">Construction</SelectItem>
              <SelectItem value="ANNADAN">Annadan</SelectItem>
              <SelectItem value="SPECIAL">Special</SelectItem>
              <SelectItem value="SEWA">Sewa</SelectItem>
              <SelectItem value="TRUST_FUND">Trust Fund</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Amount (₹) *</Label>
          <Input
            type="number"
            step="0.01"
            {...register("amount", { valueAsNumber: true })}
          />
          {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Payment Mode</Label>
          <Select
            onValueChange={(v) => { setValue("paymentMode", v as DonationFormData["paymentMode"]); setPaymentMode(v) }}
            defaultValue="CASH"
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="CASH">Cash</SelectItem>
              <SelectItem value="CHEQUE">Cheque</SelectItem>
              {isAdminOrAccountant && (
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
        </div>
        <div className="space-y-2">
          <Label>Deposit to Account {disableDepositAccount && "(Disabled for Cash)"}</Label>
          <Select 
            onValueChange={(v) => setValue("accountId", (v as string) === "__none" ? "" : v as string)}
            disabled={disableDepositAccount}
          >
            <SelectTrigger><SelectValue placeholder={disableDepositAccount ? "N/A" : "Select account"} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__none">— Direct —</SelectItem>
              {filteredAccounts.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
            </SelectContent>
          </Select>
          {errors.accountId && <p className="text-xs text-destructive">{errors.accountId.message}</p>}
        </div>
      </div>

      {/* Cheque Fields */}
      {showChequeFields && (
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Cheque No.</Label>
            <Input {...register("chequeNumber")} />
          </div>
          <div className="space-y-2">
            <Label>Cheque Date</Label>
            <Input type="date" {...register("chequeDate")} />
          </div>
          <div className="space-y-2">
            <Label>Bank Name</Label>
            <Input {...register("bankNameCheque")} />
          </div>
        </div>
      )}

      {/* Transaction ID for UPI / NEFT / RTGS */}
      {showTxnField && (
        <div className="space-y-2">
          <Label>Transaction / Reference ID</Label>
          <Input {...register("transactionId")} placeholder="UTR / Ref Number" />
        </div>
      )}

      <Separator />

      {/* Collected by Member */}
      <div className="space-y-2">
        <Label>Collected by Member (optional)</Label>
        <Select 
          onValueChange={(v) => setValue("collectedByMemberId", (v as string) === "__none" ? "" : v as string)}
          defaultValue={loggedInMemberId || undefined}
          disabled={!!loggedInMemberId && !isAdminOrAccountant}
        >
          <SelectTrigger>
            <SelectValue placeholder="Direct receipt (not via member)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none">— Direct Receipt —</SelectItem>
            {collectors.map((m) => (
              <SelectItem key={m.id} value={m.id}>{m.name} ({m.memberId})</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          {!!loggedInMemberId && !isAdminOrAccountant 
            ? "Your member profile is automatically selected for cash collection."
            : "If collected by a member, it will need accountant verification before entering the Cash Book."}
        </p>
      </div>

      <div className="space-y-2">
        <Label>Notes</Label>
        <Input {...register("notes")} />
      </div>

      <Button className="w-full" type="submit" disabled={isPending}>
        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Save Donation
      </Button>
    </form>
  )
}
