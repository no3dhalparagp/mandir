"use client"

import * as React from "react"
import { toast } from "sonner"
import { format } from "date-fns"
import { Loader2, Lock, Unlock, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { closeMonthBook, closeYearBook, reopenBookClosure } from "@/app/dashboard/settings/actions"

type ClosureItem = {
  id: string
  closureType: "MONTH" | "YEAR"
  label: string
  periodStart: Date
  periodEnd: Date
  notes: string | null
  closedAt: Date
  closedBy: { name: string | null; email: string } | null
}

export function BookClosureCard({ closures }: { closures: ClosureItem[] }) {
  const [month, setMonth] = React.useState(() => format(new Date(), "yyyy-MM"))
  const [year, setYear] = React.useState(() => String(new Date().getFullYear()))
  const [notes, setNotes] = React.useState("")
  const [pendingAction, setPendingAction] = React.useState<"month" | "year" | `reopen:${string}` | null>(null)

  async function handleCloseMonth() {
    setPendingAction("month")
    const res = await closeMonthBook({ month, notes: notes || undefined })
    setPendingAction(null)
    if (res.error) return toast.error(res.error)
    toast.success("Month book closed successfully.")
    setNotes("")
  }

  async function handleCloseYear() {
    setPendingAction("year")
    const res = await closeYearBook({ year: Number(year), notes: notes || undefined })
    setPendingAction(null)
    if (res.error) return toast.error(res.error)
    toast.success("Year book closed successfully.")
    setNotes("")
  }

  async function handleReopen(id: string, label: string) {
    if (!window.confirm(`Are you sure you want to reopen the books for "${label}"? This will allow backdated entries for this period.`)) {
      return
    }

    const token = `reopen:${id}` as const
    setPendingAction(token)
    const res = await reopenBookClosure(id)
    setPendingAction(null)
    if (res.error) return toast.error(res.error)
    toast.success(`Closed period "${label}" has been reopened.`)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Book End Controls</CardTitle>
        <CardDescription>Close month/year books to prevent backdated accounting entries.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label>Month Book End</Label>
            <Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Year Book End</Label>
            <Input type="number" value={year} min={2000} max={2200} onChange={(e) => setYear(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Notes (optional)</Label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Reason / remarks" />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button onClick={handleCloseMonth} disabled={pendingAction !== null || !month}>
            {pendingAction === "month" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Lock className="mr-2 h-4 w-4" />}
            Close Month Book
          </Button>
          <Button onClick={handleCloseYear} variant="secondary" disabled={pendingAction !== null || !year}>
            {pendingAction === "year" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Lock className="mr-2 h-4 w-4" />}
            Close Year Book
          </Button>
        </div>

        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-[100px]">Type</TableHead>
                <TableHead>Label</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Closed By</TableHead>
                <TableHead>Closed At</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {closures.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    No closed periods yet.
                  </TableCell>
                </TableRow>
              ) : (
                closures.map((closure) => (
                  <TableRow key={closure.id} className="group">
                    <TableCell>
                      <Badge variant={closure.closureType === "YEAR" ? "default" : "outline"}>
                        {closure.closureType}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {closure.label}
                        {closure.notes && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <MessageSquare className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="max-w-xs">{closure.notes}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {format(new Date(closure.periodStart), "dd MMM yyyy")} - {format(new Date(closure.periodEnd), "dd MMM yyyy")}
                    </TableCell>
                    <TableCell className="text-sm">
                      {closure.closedBy?.name || closure.closedBy?.email || "-"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(closure.closedAt), "dd MMM, hh:mm a")}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleReopen(closure.id, closure.label)}
                        disabled={pendingAction !== null}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        {pendingAction === `reopen:${closure.id}` ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Unlock className="mr-2 h-4 w-4" />
                        )}
                        Reopen
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
