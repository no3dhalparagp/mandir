"use client"

import { useMemo, useState } from "react"
import { format } from "date-fns"

import { BulkSendToCashToolbar } from "./bulk-send-to-cash-toolbar"
import { Badge } from "@/components/ui/badge"
import {
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { VerifyCollectionButton } from "@/components/collections/verify-collection-button"
import { DepositCollectionButton } from "@/components/collections/deposit-collection-button"

type CollectionWithFlags = {
  id: string
  collectedDate: Date
  collectedAmount: number
  verifiedAmount: number | null
  verifiedById: string | null
  status: string
  isInCashAccount?: boolean
  canSendToCash?: boolean
  member: {
    name: string
    memberId: string
  }
  donation: {
    donorName: string
    receiptNo: string
  }
  depositedToAccount: {
    name: string
  } | null
  verifiedBy: {
    name: string
  } | null
}

type BankAccount = {
  id: string
  name: string
  accountType: string
}

const statusColors: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  COLLECTED: "secondary",
  DEPOSITED: "outline",
  VERIFIED: "default",
  DISCREPANT: "destructive",
}

type Props = {
  collections: CollectionWithFlags[]
  accounts: BankAccount[]
  isAdminOrAccountant: boolean
}

export function CollectionsTable({
  collections,
  accounts,
  isAdminOrAccountant,
}: Props) {
  const [selected, setSelected] = useState<Record<string, boolean>>({})

  const cashAccounts = useMemo(
    () => accounts.filter((a) => a.accountType === "CASH_IN_HAND"),
    [accounts]
  )

  const eligibleCollections = useMemo(
    () =>
      collections.filter(
        (c) =>
          c.status === "VERIFIED" &&
          !c.isInCashAccount &&
          !!c.canSendToCash
      ),
    [collections]
  )

  const selectedIds = useMemo(
    () =>
      Object.entries(selected)
        .filter(([_, v]) => v)
        .map(([id]) => id)
        .filter((id) =>
          eligibleCollections.some((c) => c.id === id)
        ),
    [selected, eligibleCollections]
  )

  const toggleRow = (id: string, checked: boolean) => {
    setSelected((prev) => ({ ...prev, [id]: checked }))
  }

  const toggleAll = (checked: boolean) => {
    if (!checked) {
      setSelected({})
      return
    }

    const next: Record<string, boolean> = {}
    for (const c of eligibleCollections) {
      next[c.id] = true
    }
    setSelected(next)
  }

  return (
    <>
      {isAdminOrAccountant && (
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>
            {isAdminOrAccountant ? "All Collections" : "My Collections"}
          </CardTitle>

          <BulkSendToCashToolbar
            cashAccounts={cashAccounts}
            selectedIds={selectedIds}
            onCompleted={() => setSelected({})}
          />
        </CardHeader>
      )}

      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]">
                {isAdminOrAccountant && (
                  <Checkbox
                    checked={
                      eligibleCollections.length > 0 &&
                      selectedIds.length ===
                        eligibleCollections.length
                    }
                    onCheckedChange={(val) =>
                      toggleAll(val === true)
                    }
                    aria-label="Select all verified not-in-cash collections"
                  />
                )}
              </TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Member</TableHead>
              <TableHead>Donor / Receipt</TableHead>
              <TableHead>Collected (₹)</TableHead>
              <TableHead>Verified (₹)</TableHead>
              <TableHead>Shortage (₹)</TableHead>
              <TableHead>Deposited To</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Verified By</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {collections.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={11}
                  className="h-24 text-center text-muted-foreground"
                >
                  No collections found.
                </TableCell>
              </TableRow>
            ) : (
              collections.map((c) => {
                const verifiedAmount =
                  c.verifiedAmount ?? c.collectedAmount

                const shortage =
                  c.status === "DISCREPANT"
                    ? c.collectedAmount - verifiedAmount
                    : 0

                const selectable =
                  isAdminOrAccountant &&
                  c.status === "VERIFIED" &&
                  !c.isInCashAccount &&
                  !!c.canSendToCash

                return (
                  <TableRow key={c.id}>
                    <TableCell>
                      {selectable && (
                        <Checkbox
                          checked={!!selected[c.id]}
                          onCheckedChange={(val) =>
                            toggleRow(c.id, val === true)
                          }
                          aria-label="Select collection"
                        />
                      )}
                    </TableCell>

                    <TableCell className="text-sm">
                      {format(c.collectedDate, "dd MMM yy")}
                    </TableCell>

                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">
                          {c.member.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {c.member.memberId}
                        </p>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div>
                        <p className="text-sm">
                          {c.donation.donorName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {c.donation.receiptNo}
                        </p>
                      </div>
                    </TableCell>

                    <TableCell className="font-bold">
                      ₹
                      {c.collectedAmount.toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                      })}
                    </TableCell>

                    <TableCell className="font-medium">
                      ₹
                      {verifiedAmount.toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                      })}
                    </TableCell>

                    <TableCell>
                      {shortage > 0 ? (
                        <span className="font-bold text-red-600">
                          ₹
                          {shortage.toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                      ) : (
                        "—"
                      )}
                    </TableCell>

                    <TableCell className="text-sm text-muted-foreground">
                      {c.depositedToAccount?.name ?? "—"}
                    </TableCell>

                    <TableCell>
                      <Badge
                        variant={
                          statusColors[c.status] ?? "outline"
                        }
                      >
                        {c.status}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-sm text-muted-foreground">
                      {c.verifiedBy?.name ?? "—"}
                    </TableCell>

                    <TableCell className="text-right">
                      {isAdminOrAccountant &&
                        c.status === "COLLECTED" && (
                          <DepositCollectionButton
                            collectionId={c.id}
                            accounts={accounts}
                          />
                        )}

                      {isAdminOrAccountant &&
                        ["DEPOSITED", "COLLECTED"].includes(
                          c.status
                        ) && (
                          <div className="ml-2 inline-block">
                            <VerifyCollectionButton
                              collectionId={c.id}
                              collectedAmount={
                                c.collectedAmount
                              }
                            />
                          </div>
                        )}

                      {isAdminOrAccountant &&
                        c.status === "DISCREPANT" && (
                          <div className="ml-2 inline-block">
                            <DepositCollectionButton
                              collectionId={c.id}
                              accounts={accounts}
                              recollectMode
                              recollectAmount={shortage}
                            />
                          </div>
                        )}
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </CardContent>
    </>
  )
}

