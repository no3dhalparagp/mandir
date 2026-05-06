"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { format } from "date-fns"
import { CalendarIcon, Loader2, CheckCircle2, ArrowRight } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"

import { getUnreconciledEntries, submitReconciliation } from "@/app/dashboard/bank/reconciliation/actions"

const setupSchema = z.object({
  accountId: z.string().min(1, "Select an account"),
  statementFromDate: z.date(),
  statementToDate: z.date(),
  openingBalanceBank: z.coerce.number(),
  closingBalanceBank: z.coerce.number(),
  notes: z.string().optional()
})

type SetupData = z.infer<typeof setupSchema>

export function ReconciliationWizard({ accounts }: { accounts: { id: string; name: string }[] }) {
  const router = useRouter()
  const [step, setStep] = React.useState<1 | 2>(1)
  const [setupData, setSetupData] = React.useState<SetupData | null>(null)
  
  // Step 2 State
  const [entries, setEntries] = React.useState<any[]>([])
  const [loadingEntries, setLoadingEntries] = React.useState(false)
  const [matchedIds, setMatchedIds] = React.useState<Set<string>>(new Set())
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<SetupData>({
    resolver: zodResolver(setupSchema) as any,
    defaultValues: {
      statementFromDate: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1), // 1st of last month
      statementToDate: new Date(new Date().getFullYear(), new Date().getMonth(), 0), // Last day of last month
      openingBalanceBank: 0,
      closingBalanceBank: 0,
    }
  })

  const fromDate = watch("statementFromDate")
  const toDate = watch("statementToDate")

  async function onSetupComplete(data: SetupData) {
    setSetupData(data)
    setLoadingEntries(true)
    setStep(2)
    
    const unrec = await getUnreconciledEntries(data.accountId, data.statementToDate)
    setEntries(unrec)
    setLoadingEntries(false)
  }

  function toggleMatch(id: string) {
    const next = new Set(matchedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setMatchedIds(next)
  }

  async function finishReconciliation() {
    if (!setupData) return
    setIsSubmitting(true)
    
    const res = await submitReconciliation({
      ...setupData,
      matchedEntryIds: Array.from(matchedIds)
    })
    
    if (res.error) {
      toast.error(res.error)
      setIsSubmitting(false)
    } else {
      toast.success("Reconciliation completed successfully!")
      router.push("/dashboard/bank/reconciliation")
      router.refresh()
    }
  }

  // Calculated totals for step 2
  const matchedTotal = entries
    .filter(e => matchedIds.has(e.id))
    .reduce((sum, e) => {
      const isDebit = ["EXPENSE", "TRANSFER_OUT"].includes(e.type)
      return isDebit ? sum - e.amount : sum + e.amount
    }, 0)

  // (Target Bank Closing) = Opening Bank + matched transactions
  const calculatedClosing = (setupData?.openingBalanceBank || 0) + matchedTotal
  const targetClosing = setupData?.closingBalanceBank || 0
  const difference = calculatedClosing - targetClosing

  if (step === 2) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Match Ledger Entries</CardTitle>
          <CardDescription>
            Select the entries that appear on your physical bank statement to match the closing balance of ₹{targetClosing.toLocaleString("en-IN", { minimumFractionDigits: 2 })}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">Statement Opening</p>
              <p className="text-xl font-semibold">₹{(setupData?.openingBalanceBank || 0).toLocaleString("en-IN")}</p>
            </div>
            <div className="bg-primary/10 p-4 rounded-lg border border-primary/20">
              <p className="text-sm text-primary">Calculated Closing</p>
              <p className="text-xl font-bold text-primary">₹{calculatedClosing.toLocaleString("en-IN")}</p>
            </div>
            <div className={cn("p-4 rounded-lg border", difference === 0 ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200")}>
              <p className={cn("text-sm", difference === 0 ? "text-green-700" : "text-red-700")}>Difference</p>
              <p className={cn("text-xl font-bold", difference === 0 ? "text-green-700" : "text-red-700")}>
                ₹{difference.toLocaleString("en-IN")}
              </p>
            </div>
          </div>

          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px] text-center">Match</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Credit (₹)</TableHead>
                  <TableHead className="text-right">Debit (₹)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingEntries ? (
                  <TableRow><TableCell colSpan={5} className="text-center h-32"><Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" /></TableCell></TableRow>
                ) : entries.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center h-32 text-muted-foreground">No unreconciled entries found for this period.</TableCell></TableRow>
                ) : (
                  entries.map((entry) => {
                    const isDebit = ["EXPENSE", "TRANSFER_OUT"].includes(entry.type)
                    return (
                      <TableRow key={entry.id} className={matchedIds.has(entry.id) ? "bg-muted/50" : ""}>
                        <TableCell className="text-center">
                          <Checkbox checked={matchedIds.has(entry.id)} onCheckedChange={() => toggleMatch(entry.id)} />
                        </TableCell>
                        <TableCell>{format(new Date(entry.date), "dd MMM yyyy")}</TableCell>
                        <TableCell>{entry.description}</TableCell>
                        <TableCell className="text-right font-medium text-green-600">{!isDebit ? entry.amount.toLocaleString("en-IN") : ""}</TableCell>
                        <TableCell className="text-right font-medium text-red-600">{isDebit ? entry.amount.toLocaleString("en-IN") : ""}</TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        <CardFooter className="justify-between">
          <Button variant="outline" onClick={() => setStep(1)} disabled={isSubmitting}>Back to Setup</Button>
          <Button onClick={finishReconciliation} disabled={isSubmitting} className="gap-2">
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {difference === 0 ? <><CheckCircle2 className="h-4 w-4" /> Complete Reconciliation</> : "Save as Draft (Unbalanced)"}
          </Button>
        </CardFooter>
      </Card>
    )
  }

  // Step 1: Setup
  return (
    <Card>
      <CardHeader>
        <CardTitle>Reconciliation Setup</CardTitle>
        <CardDescription>Enter the details from your physical or digital bank statement.</CardDescription>
      </CardHeader>
      <CardContent>
        <form id="setup-form" onSubmit={handleSubmit(onSetupComplete)} className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2 col-span-2 md:col-span-1">
            <Label>Bank Account *</Label>
            <Select onValueChange={(v) => setValue("accountId", v as string)}>
              <SelectTrigger><SelectValue placeholder="Select account" /></SelectTrigger>
              <SelectContent>
                {accounts.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
              </SelectContent>
            </Select>
            {errors.accountId && <p className="text-xs text-destructive">{errors.accountId.message}</p>}
          </div>

          <div className="hidden md:block" />

          <div className="space-y-2">
            <Label>Statement Start Date *</Label>
            <Popover>
              <PopoverTrigger render={
                <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !fromDate && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {fromDate ? format(fromDate, "PPP") : <span>Pick a date</span>}
                </Button>
              } />
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={fromDate} onSelect={(d) => d && setValue("statementFromDate", d)} initialFocus />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label>Statement End Date *</Label>
            <Popover>
              <PopoverTrigger render={
                <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !toDate && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {toDate ? format(toDate, "PPP") : <span>Pick a date</span>}
                </Button>
              } />
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={toDate} onSelect={(d) => d && setValue("statementToDate", d)} initialFocus />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label>Opening Balance on Statement (₹) *</Label>
            <Input type="number" step="0.01" {...register("openingBalanceBank")} />
          </div>

          <div className="space-y-2">
            <Label>Closing Balance on Statement (₹) *</Label>
            <Input type="number" step="0.01" {...register("closingBalanceBank")} />
          </div>
          
          <div className="space-y-2 col-span-2">
            <Label>Notes (Optional)</Label>
            <Input {...register("notes")} placeholder="e.g. Month End statement" />
          </div>
        </form>
      </CardContent>
      <CardFooter className="justify-end">
        <Button form="setup-form" type="submit" className="gap-2">
          Next: Match Entries <ArrowRight className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  )
}
