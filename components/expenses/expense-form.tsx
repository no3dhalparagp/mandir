"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import { createExpense } from "@/app/dashboard/expenses/actions"

// Exact list of payment modes – matches the Prisma/PaymentMode enum
const PAYMENT_MODES = [
  "CASH", "UPI", "CHEQUE", "NEFT", "RTGS", "DD", "IMPS"
] as const

const expenseSchema = z.object({
  title: z.string().min(2, "Title is required."),
  category: z.enum([
    "PUJA_MATERIALS",
    "ELECTRICITY",
    "SALARY",
    "MAINTENANCE",
    "DECORATION",
    "FOOD_PRASAD",
    "CONSTRUCTION",
    "PRINTING",
    "TRANSPORT",
    "MISC",
  ]),
  amount: z.number({ error: "Amount is required" }).min(1, "Amount must be positive"),
  vendorName: z.string().optional(),
  vendorMobile: z.string().optional(),
  paymentMode: z.enum(PAYMENT_MODES), // ✅ matches server action PaymentMode
  chequeNumber: z.string().optional(),
  chequeDate: z.string().optional(),
  transactionId: z.string().optional(),
  billNumber: z.string().optional(),
  accountId: z.string().optional(),
  chequeLeafId: z.string().optional(),
  isAssetPurchase: z.boolean().optional(),
  assetName: z.string().optional(),
  assetCategory: z.string().optional(),
  assetUsefulLifeYears: z.preprocess(
    (value) => (value === "" || Number.isNaN(value) ? undefined : value),
    z.number().int().positive().optional()
  ),
  assetLocation: z.string().optional(),
  notes: z.string().optional(),
})

type ExpenseFormData = z.input<typeof expenseSchema>

interface ExpenseFormProps {
  onSuccess: () => void
  accounts: { id: string; name: string }[]
  chequeLeaves: { id: string; chequeNumber: string; accountId: string; account: { name: string } }[]
}

export function ExpenseForm({ onSuccess, accounts, chequeLeaves }: ExpenseFormProps) {
  const [isPending, startTransition] = React.useTransition()
  const [paymentMode, setPaymentMode] = React.useState<ExpenseFormData["paymentMode"]>("CASH")
  const [isAssetPurchase, setIsAssetPurchase] = React.useState(false)

  const form = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: { category: "MISC", paymentMode: "CASH", isAssetPurchase: false },
  })

  function onSubmit(data: ExpenseFormData) {
    startTransition(async () => {
      const parsed = expenseSchema.parse(data)
      const result = await createExpense(parsed)
      if (result.error) toast.error(result.error)
      else { toast.success("Expense recorded!"); onSuccess() }
    })
  }

  const showCheque = paymentMode === "CHEQUE" || paymentMode === "DD"
  const showTxn = ["UPI", "NEFT", "RTGS", "IMPS"].includes(paymentMode)
  const selectedAccountId = form.watch("accountId")

  const nextChequeByAccount = React.useMemo(() => {
    const sorted = [...chequeLeaves].sort((a, b) =>
      a.chequeNumber.localeCompare(b.chequeNumber, undefined, {
        numeric: true,
        sensitivity: "base",
      })
    )

    const map = new Map<string, (typeof chequeLeaves)[number]>()
    for (const leaf of sorted) {
      if (!map.has(leaf.accountId)) {
        map.set(leaf.accountId, leaf)
      }
    }
    return map
  }, [chequeLeaves])

  const nextCheques = React.useMemo(
    () => Array.from(nextChequeByAccount.values()),
    [nextChequeByAccount]
  )
  const accountNameById = React.useMemo(
    () => new Map(accounts.map((a) => [a.id, a.name])),
    [accounts]
  )

  React.useEffect(() => {
    if (!showCheque) {
      form.setValue("chequeLeafId", "")
      return
    }

    if (selectedAccountId) {
      const nextLeaf = nextChequeByAccount.get(selectedAccountId)
      form.setValue("chequeLeafId", nextLeaf?.id ?? "")
      form.setValue("chequeNumber", nextLeaf?.chequeNumber ?? "")
      return
    }

    form.setValue("chequeLeafId", "")
  }, [showCheque, selectedAccountId, nextChequeByAccount, form])

  return (
    <Form {...form}>
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
      <FormField control={form.control} name="title" render={({ field }) => (
        <FormItem>
          <FormLabel>Title *</FormLabel>
          <FormControl><Input {...field} /></FormControl>
          <FormMessage />
        </FormItem>
      )} />

      <div className="grid grid-cols-2 gap-4">
        <FormField control={form.control} name="category" render={({ field }) => (
          <FormItem>
            <FormLabel>Category</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
              <SelectContent>
                <SelectItem value="PUJA_MATERIALS">Puja Materials</SelectItem>
                <SelectItem value="ELECTRICITY">Electricity</SelectItem>
                <SelectItem value="SALARY">Salary</SelectItem>
                <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                <SelectItem value="DECORATION">Decoration</SelectItem>
                <SelectItem value="FOOD_PRASAD">Food / Prasad</SelectItem>
                <SelectItem value="CONSTRUCTION">Construction</SelectItem>
                <SelectItem value="PRINTING">Printing</SelectItem>
                <SelectItem value="TRANSPORT">Transport</SelectItem>
                <SelectItem value="MISC">Miscellaneous</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="amount" render={({ field }) => (
          <FormItem>
            <FormLabel>Amount (₹) *</FormLabel>
            <FormControl><Input type="number" step="0.01" value={field.value ?? ""} onChange={(e) => field.onChange(e.target.valueAsNumber)} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormField control={form.control} name="vendorName" render={({ field }) => (
          <FormItem><FormLabel>Vendor Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="billNumber" render={({ field }) => (
          <FormItem><FormLabel>Bill Number</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
        )} />
      </div>

      <Separator />

      <div className="grid grid-cols-2 gap-4">
        <FormField control={form.control} name="paymentMode" render={({ field }) => (
          <FormItem>
            <FormLabel>Payment Mode</FormLabel>
            <Select onValueChange={(v) => { field.onChange(v); setPaymentMode(v as ExpenseFormData["paymentMode"]) }} defaultValue={field.value}>
              <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
              <SelectContent>
                <SelectItem value="CASH">Cash</SelectItem>
                <SelectItem value="UPI">UPI</SelectItem>
                <SelectItem value="CHEQUE">Cheque</SelectItem>
                <SelectItem value="NEFT">NEFT</SelectItem>
                <SelectItem value="RTGS">RTGS</SelectItem>
                <SelectItem value="IMPS">IMPS</SelectItem>
                <SelectItem value="DD">Demand Draft</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="accountId" render={({ field }) => (
          <FormItem>
            <FormLabel>Paid from Account</FormLabel>
            <Select onValueChange={(v) => field.onChange(v === "__none" ? "" : v)} value={field.value || "__none"}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select account">
                    {field.value ? accountNameById.get(field.value) ?? "Select account" : "Select account"}
                  </SelectValue>
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="__none">— Not specified —</SelectItem>
                {accounts.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )} />
      </div>

      {showCheque && (
        <div className="grid grid-cols-1 gap-4">
          <FormField control={form.control} name="chequeLeafId" render={({ field }) => (
            <FormItem>
              <FormLabel>Use Current Cheque</FormLabel>
              <Select
                value={field.value || "__manual"}
                onValueChange={(v) => {
                  const selectedLeafId = v === "__manual" ? "" : (v as string)
                  field.onChange(selectedLeafId)

                  const leaf = chequeLeaves.find((l) => l.id === selectedLeafId)
                  form.setValue("chequeNumber", leaf?.chequeNumber ?? "")
                }}
                disabled={!!selectedAccountId && !nextChequeByAccount.has(selectedAccountId)}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Pick current cheque">
                      {field.value
                        ? (() => {
                            const selectedLeaf = chequeLeaves.find((l) => l.id === field.value)
                            return selectedLeaf
                              ? `${selectedLeaf.chequeNumber} - ${selectedLeaf.account.name}`
                              : "Pick current cheque"
                          })()
                        : "Pick current cheque"}
                    </SelectValue>
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="__manual">Manual entry</SelectItem>
                  {selectedAccountId
                    ? (() => {
                        const nextLeaf = nextChequeByAccount.get(selectedAccountId)
                        return nextLeaf ? (
                          <SelectItem key={nextLeaf.id} value={nextLeaf.id}>
                            {nextLeaf.chequeNumber} - {nextLeaf.account.name}
                          </SelectItem>
                        ) : (
                          <SelectItem value="__none" disabled>
                            No unused cheque available for selected account
                          </SelectItem>
                        )
                      })()
                    : nextCheques.map((leaf) => (
                        <SelectItem key={leaf.id} value={leaf.id}>
                          {leaf.chequeNumber} - {leaf.account.name}
                        </SelectItem>
                      ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />
          <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="chequeNumber" render={({ field }) => (
            <FormItem><FormLabel>Cheque No.</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="chequeDate" render={({ field }) => (
            <FormItem><FormLabel>Cheque Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          </div>
        </div>
      )}
      {showTxn && (
        <FormField control={form.control} name="transactionId" render={({ field }) => (
          <FormItem><FormLabel>Transaction / Reference ID</FormLabel><FormControl><Input {...field} placeholder="UTR / Ref Number" /></FormControl><FormMessage /></FormItem>
        )} />
      )}

      <FormField control={form.control} name="notes" render={({ field }) => (
        <FormItem><FormLabel>Notes</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
      )} />

      <Separator />
      <FormField control={form.control} name="isAssetPurchase" render={({ field }) => (
        <FormItem className="flex flex-row items-center gap-2 space-y-0">
          <FormControl>
            <Checkbox
              checked={isAssetPurchase}
              onCheckedChange={(checked) => {
                const value = checked === true
                setIsAssetPurchase(value)
                field.onChange(value)
              }}
            />
          </FormControl>
          <FormLabel>This expense creates a fixed asset entry</FormLabel>
        </FormItem>
      )} />
      {isAssetPurchase && (
        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="assetName" render={({ field }) => (
            <FormItem><FormLabel>Asset Name</FormLabel><FormControl><Input {...field} placeholder="Defaults to expense title" /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="assetCategory" render={({ field }) => (
            <FormItem><FormLabel>Asset Category</FormLabel><FormControl><Input {...field} placeholder="Defaults to expense category" /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="assetUsefulLifeYears" render={({ field }) => (
            <FormItem><FormLabel>Useful Life (Years)</FormLabel><FormControl><Input type="number" value={typeof field.value === "number" ? field.value : ""} onChange={(e) => field.onChange(e.target.value === "" ? undefined : e.target.valueAsNumber)} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="assetLocation" render={({ field }) => (
            <FormItem><FormLabel>Asset Location</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
          )} />
        </div>
      )}

      <Button className="w-full" type="submit" disabled={isPending}>
        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Submit Expense
      </Button>
    </form>
    </Form>
  )
}
