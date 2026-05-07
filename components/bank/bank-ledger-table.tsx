// File: components/bank/bank-ledger-table.tsx

"use client"

import { format } from "date-fns"
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Landmark,
  Wallet,
} from "lucide-react"

import { EncashChequeButton } from "@/components/bank/encash-cheque-button"

import { Badge } from "@/components/ui/badge"

import {
  Card,
  CardContent,
} from "@/components/ui/card"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

type LedgerEntry = {
  id: string
  date: Date
  type: string
  amount: number
  description: string
  runningBalance: number
  isCleared?: boolean
  clearedAt?: Date | null
}

interface BankLedgerTableProps {
  entries: LedgerEntry[]
}

export function BankLedgerTable({
  entries,
}: BankLedgerTableProps) {
  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                Date
              </TableHead>

              <TableHead>
                Description
              </TableHead>

              <TableHead>
                Type
              </TableHead>

              <TableHead>
                Amount
              </TableHead>

              <TableHead>
                Running Balance
              </TableHead>

              <TableHead>
                Cheque Status
              </TableHead>

              <TableHead>
                Encash Date
              </TableHead>

              <TableHead className="text-right">
                Action
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {entries.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="h-24 text-center text-muted-foreground"
                >
                  No ledger entries found.
                </TableCell>
              </TableRow>
            ) : (
              entries.map((entry) => {
                const isDebit = [
                  "EXPENSE",
                  "TRANSFER_OUT",
                ].includes(entry.type)

                return (
                  <TableRow
                    key={entry.id}
                  >
                    <TableCell className="text-sm">
                      {format(
                        new Date(entry.date),
                        "dd MMM yyyy"
                      )}
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-2">
                        {isDebit ? (
                          <ArrowUpCircle className="w-4 h-4 text-red-600" />
                        ) : (
                          <ArrowDownCircle className="w-4 h-4 text-green-600" />
                        )}

                        <span className="font-medium">
                          {
                            entry.description
                          }
                        </span>
                      </div>
                    </TableCell>

                    <TableCell>
                      <Badge
                        variant={
                          isDebit
                            ? "destructive"
                            : "default"
                        }
                      >
                        {entry.type}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      <div className="font-bold">
                        ₹
                        {entry.amount.toLocaleString(
                          "en-IN",
                          {
                            minimumFractionDigits: 2,
                          }
                        )}
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Wallet className="w-4 h-4 text-muted-foreground" />

                        <span className="font-bold">
                          ₹
                          {entry.runningBalance.toLocaleString(
                            "en-IN",
                            {
                              minimumFractionDigits: 2,
                            }
                          )}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell>
                      {entry.isCleared ===
                      false ? (
                        <Badge variant="destructive">
                          Pending
                        </Badge>
                      ) : (
                        <Badge className="bg-green-100 text-green-700 border-green-200">
                          Cleared
                        </Badge>
                      )}
                    </TableCell>

                    <TableCell>
                      {entry.clearedAt
                        ? format(
                            new Date(
                              entry.clearedAt
                            ),
                            "dd MMM yyyy"
                          )
                        : "—"}
                    </TableCell>

                    <TableCell className="text-right">
                      {entry.isCleared ===
                        false && (
                        <EncashChequeButton
                          ledgerEntryId={
                            entry.id
                          }
                        />
                      )}
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
