"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2, User, Phone, MapPin, Banknote, CreditCard, Tag, FileText, UserCheck, Building2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { createDonation } from "@/app/dashboard/donations/actions"

// -------------------- Constants --------------------
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

// -------------------- Schema --------------------
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
      return !(
        data.paymentMode === "CASH" &&
        !data.accountId &&
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
  const isAdmin = !!isAdminOrAccountant

  const form = useForm<DonationFormData>({
    resolver: zodResolver(donationSchema),
    defaultValues: {
      category: "GENERAL",
      paymentMode: "CASH",
      collectedByMemberId: loggedInMemberId || undefined,
    },
  })

  const watchedPaymentMode = form.watch("paymentMode")
  const isCASH = watchedPaymentMode === "CASH"
  const showChequeFields = watchedPaymentMode === "CHEQUE" || watchedPaymentMode === "DD"
  const showTxnField = ["UPI", "NEFT", "RTGS", "IMPS"].includes(watchedPaymentMode)

  // Reset account and auto-assign collector when payment mode changes
  React.useEffect(() => {
    form.setValue("accountId", "")
    if (isCASH && !isAdmin && loggedInMemberId) {
      form.setValue("collectedByMemberId", loggedInMemberId)
    }
  }, [watchedPaymentMode, isCASH, isAdmin, loggedInMemberId, form])

  const filteredAccounts = React.useMemo(
    () =>
      accounts.filter((a) => {
        if (isCASH) {
          if (!isAdmin) return false
          return a.accountType === "CASH_IN_HAND"
        }
        return a.accountType !== "CASH_IN_HAND"
      }),
    [accounts, isCASH, isAdmin]
  )

  const disableDepositAccount = isCASH && !isAdmin

  async function onSubmit(data: DonationFormData) {
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
    <Form {...form}>
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-h-[75vh] overflow-y-auto pr-2">
      {/* ---- Donor Information Card ---- */}
      <div className="rounded-xl border bg-card p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <User className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Donor Information</h3>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <FormField control={form.control} name="donorName" render={({ field }) => (
            <FormItem className="space-y-1.5">
              <FormLabel className="flex items-center">Donor Name <span className="text-destructive ml-0.5">*</span></FormLabel>
              <FormControl><Input placeholder="Full name" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="mobileNumber" render={({ field }) => (
            <FormItem className="space-y-1.5">
              <FormLabel><Phone className="inline h-3.5 w-3.5 mr-1 text-muted-foreground" />Mobile Number</FormLabel>
              <FormControl><Input placeholder="10-digit number" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>
        <FormField control={form.control} name="address" render={({ field }) => (
          <FormItem className="mt-4 space-y-1.5">
            <FormLabel><MapPin className="inline h-3.5 w-3.5 mr-1 text-muted-foreground" />Address</FormLabel>
            <FormControl><Input placeholder="Address (optional)" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
      </div>

      {/* ---- Payment Details Card ---- */}
      <div className="rounded-xl border bg-card p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Banknote className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Payment Details</h3>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <FormField control={form.control} name="category" render={({ field }) => (
            <FormItem className="space-y-1.5">
              <FormLabel><Tag className="inline h-3.5 w-3.5 mr-1 text-muted-foreground" />Category</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat.charAt(0) + cat.slice(1).toLowerCase().replace("_", " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="amount" render={({ field }) => (
            <FormItem className="space-y-1.5">
            <FormLabel className="flex items-center">
              Amount <span className="text-destructive ml-0.5">*</span>
            </FormLabel>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium">
                ₹
              </span>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  className="pl-8"
                  value={field.value ?? ""}
                  onChange={(e) => field.onChange(e.target.valueAsNumber)}
                />
              </FormControl>
            </div>
            <FormMessage />
          </FormItem>
          )} />
        </div>

        <div className="grid sm:grid-cols-2 gap-4 mt-4">
          <FormField control={form.control} name="paymentMode" render={({ field }) => (
            <FormItem className="space-y-1.5">
              <FormLabel><CreditCard className="inline h-3.5 w-3.5 mr-1 text-muted-foreground" />Payment Mode</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl><SelectTrigger className="w-full"><SelectValue /></SelectTrigger></FormControl>
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
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="accountId" render={({ field }) => (
            <FormItem className="space-y-1.5">
            <FormLabel className="flex items-center">
              <Building2 className="inline h-3.5 w-3.5 mr-1 text-muted-foreground" />
              Deposit to Account
              {disableDepositAccount && (
                <span className="text-xs text-muted-foreground ml-1">(disabled for cash)</span>
              )}
            </FormLabel>
            <Select
              onValueChange={(v) => field.onChange(v === "__none" ? "" : v)}
              value={field.value || "__none"}
              disabled={disableDepositAccount}
            >
              <FormControl>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select account…" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="__none">— Direct —</SelectItem>
                {filteredAccounts.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
          )} />
        </div>

        {/* Cheque / DD specific fields */}
        {showChequeFields && (
          <div className="mt-4 p-4 rounded-lg bg-muted/30 border border-dashed">
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <FormField control={form.control} name="chequeNumber" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cheque No.</FormLabel>
                    <FormControl><Input placeholder="123456" {...field} /></FormControl>
                  </FormItem>
                )} />
              </div>
              <div className="space-y-1.5">
                <FormField control={form.control} name="chequeDate" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cheque Date</FormLabel>
                    <FormControl><Input type="date" {...field} /></FormControl>
                  </FormItem>
                )} />
              </div>
              <div className="space-y-1.5">
                <FormField control={form.control} name="bankNameCheque" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bank Name</FormLabel>
                    <FormControl><Input placeholder="Bank name" {...field} /></FormControl>
                  </FormItem>
                )} />
              </div>
            </div>
          </div>
        )}

        {/* Transaction ID for digital payments */}
        {showTxnField && (
          <FormField control={form.control} name="transactionId" render={({ field }) => (
            <FormItem className="mt-4 space-y-1.5">
              <FormLabel>Transaction / Reference ID</FormLabel>
              <FormControl><Input {...field} placeholder="UTR / Ref Number" /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        )}
      </div>

      {/* ---- Collection Info Card ---- */}
      <div className="rounded-xl border bg-card p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <UserCheck className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Collection & Notes</h3>
        </div>
        <FormField control={form.control} name="collectedByMemberId" render={({ field }) => (
          <FormItem className="space-y-1.5">
          <FormLabel>Collected by Member</FormLabel>
          <Select
            onValueChange={(v) => field.onChange(v === "__none" ? "" : v)}
            value={field.value || "__none"}
            disabled={!!loggedInMemberId && !isAdmin}
          >
            <FormControl>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Direct receipt (not via member)" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              <SelectItem value="__none">— Direct Receipt —</SelectItem>
              {collectors.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.name} ({m.memberId})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground mt-1">
            {!!loggedInMemberId && !isAdmin
              ? "Your member profile is automatically selected for cash collection."
              : "If collected by a member, it will need verification before entering the Cash Book."}
          </p>
          <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="notes" render={({ field }) => (
          <FormItem className="mt-4 space-y-1.5">
            <FormLabel>
              <FileText className="inline h-3.5 w-3.5 mr-1 text-muted-foreground" />
              Notes
            </FormLabel>
            <FormControl><Input placeholder="Any additional notes..." {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
      </div>

      {/* ---- Submit Button ---- */}
      <Button className="w-full" size="lg" type="submit" disabled={isPending}>
        {isPending ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Banknote className="mr-2 h-4 w-4" />
        )}
        {isPending ? "Saving..." : "Save Donation"}
      </Button>
    </form>
    </Form>
  )
}
