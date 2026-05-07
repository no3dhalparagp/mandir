import { prisma } from "@/lib/prisma"
import { format } from "date-fns"
import { ArrowUpCircle, ArrowDownCircle, Printer } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export const metadata = {
  title: "Member Passbook | Reports",
  description: "View member account passbook with transaction history",
}

export default async function PassbookPage({
  searchParams
}: {
  searchParams: Promise<{ memberId?: string; month?: string; year?: string }>
}) {
  const { memberId, month, year } = await searchParams
  
  // Get all members with their accounts
  const members = await prisma.member.findMany({
    include: {
      memberAccount: true
    },
    orderBy: { name: "asc" }
  })
  
  // Default to first member if not specified
  const defaultMemberId = memberId || members[0]?.id
  const currentMember = members.find(m => m.id === defaultMemberId)
  
  const currentMonth = month ? parseInt(month) : new Date().getMonth() + 1
  const currentYear = year ? parseInt(year) : new Date().getFullYear()

  const startDate = new Date(currentYear, currentMonth - 1, 1)
  const endDate = new Date(currentYear, currentMonth, 0, 23, 59, 59)

  let entries: any[] = []
  let openingBalance = 0

  if (currentMember?.memberAccount) {
    // Fetch opening balance from entries before the period
    const priorEntries = await prisma.passbook.findMany({
      where: {
        memberAccountId: currentMember.memberAccount.id,
        date: { lt: startDate }
      },
      orderBy: { date: "desc" },
      take: 1
    })

    openingBalance = priorEntries.length > 0 ? priorEntries[0].balance : currentMember.memberAccount.openingBalance

    // Fetch entries for the period
    entries = await prisma.passbook.findMany({
      where: {
        memberAccountId: currentMember.memberAccount.id,
        date: { gte: startDate, lte: endDate }
      },
      orderBy: { date: "asc" }
    })
  }

  // Calculate closing balance
  let closingBalance = openingBalance
  entries.forEach(entry => {
    closingBalance = entry.balance
  })

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Member Passbook</h1>
          <p className="text-muted-foreground">View individual member account transactions and balance history.</p>
        </div>
        <Button variant="outline" className="gap-2" onClick={() => window.print()}>
          <Printer className="h-4 w-4" /> Print Passbook
        </Button>
      </div>

      <Card className="print:hidden">
        <CardContent className="p-4 flex flex-col gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Member</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 max-h-64 overflow-y-auto">
              {members.map(m => (
                <Link key={m.id} href={`?memberId=${m.id}&month=${currentMonth}&year=${currentYear}`}>
                  <Button 
                    variant={m.id === defaultMemberId ? "default" : "outline"} 
                    size="sm" 
                    className="w-full"
                  >
                    <span className="text-xs">{m.name}</span>
                  </Button>
                </Link>
              ))}
            </div>
          </div>
          
          <div className="flex gap-2 items-end">
            <Link href={`?memberId=${defaultMemberId}&month=${currentMonth - 1 === 0 ? 12 : currentMonth - 1}&year=${currentMonth - 1 === 0 ? currentYear - 1 : currentYear}`}>
              <Button variant="outline" size="sm">← Prev Month</Button>
            </Link>
            <div className="px-4 py-2 border rounded-md text-sm font-bold bg-muted/50">
              {format(startDate, "MMMM yyyy")}
            </div>
            <Link href={`?memberId=${defaultMemberId}&month=${currentMonth + 1 === 13 ? 1 : currentMonth + 1}&year=${currentMonth + 1 === 13 ? currentYear + 1 : currentYear}`}>
              <Button variant="outline" size="sm">Next Month →</Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {currentMember ? (
        <Card>
          <CardHeader className="text-center print:text-center pb-2 border-b">
            <CardTitle className="text-2xl">{currentMember.name} - Passbook</CardTitle>
            <CardDescription>
              Member ID: {currentMember.memberId} | For the period of {format(startDate, "dd MMM yyyy")} to {format(endDate, "dd MMM yyyy")}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Debit (₹)</TableHead>
                  <TableHead className="text-right">Credit (₹)</TableHead>
                  <TableHead className="text-right">Balance (₹)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow className="bg-muted/30">
                  <TableCell className="font-medium">{format(startDate, "dd MMM yyyy")}</TableCell>
                  <TableCell className="font-medium italic text-muted-foreground">Opening Balance Brought Forward</TableCell>
                  <TableCell></TableCell>
                  <TableCell></TableCell>
                  <TableCell className="text-right font-bold text-primary">
                    {openingBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </TableCell>
                </TableRow>
                
                {entries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                      No transactions in this period.
                    </TableCell>
                  </TableRow>
                ) : (
                  entries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="text-sm whitespace-nowrap">{format(entry.date, "dd MMM yyyy")}</TableCell>
                      <TableCell className="text-sm">
                        <div className="flex items-center gap-2">
                          {entry.debit > 0 && <ArrowDownCircle className="h-4 w-4 text-red-500" />}
                          {entry.credit > 0 && <ArrowUpCircle className="h-4 w-4 text-green-500" />}
                          <span>{entry.description}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium text-red-600">
                        {entry.debit > 0 ? entry.debit.toLocaleString("en-IN", { minimumFractionDigits: 2 }) : ""}
                      </TableCell>
                      <TableCell className="text-right font-medium text-green-600">
                        {entry.credit > 0 ? entry.credit.toLocaleString("en-IN", { minimumFractionDigits: 2 }) : ""}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {entry.balance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </TableCell>
                    </TableRow>
                  ))
                )}
                
                <TableRow className="bg-muted/50 font-bold border-t-2">
                  <TableCell colSpan={3} className="text-right">Closing Balance Carried Forward:</TableCell>
                  <TableCell></TableCell>
                  <TableCell className="text-right text-primary text-lg">
                    {closingBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            No members found in the system. Please add members first.
          </CardContent>
        </Card>
      )}
    </div>
  )
}
