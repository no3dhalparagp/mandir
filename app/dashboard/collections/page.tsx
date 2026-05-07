// File: app/dashboard/collections/page.tsx

import { getAllCollections } from "./actions"
import { getBankAccounts } from "@/app/dashboard/bank/actions"

import { format } from "date-fns"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

import { Badge } from "@/components/ui/badge"

import {
  Card,
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

import { VerifyCollectionButton } from "@/components/collections/verify-collection-button"

import { DepositCollectionButton } from "@/components/collections/deposit-collection-button"

const statusColors: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  COLLECTED: "secondary",
  DEPOSITED: "outline",
  VERIFIED: "default",
  DISCREPANT: "destructive",
}

export default async function CollectionsPage() {
  const session = await auth()

  const user = session?.user?.id
    ? await prisma.user.findUnique({
        where: {
          id: session.user.id,
        },

        include: {
          member: true,
        },
      })
    : null

  const isAdminOrAccountant =
    !!user &&
    [
      "SUPER_ADMIN",
      "COMMITTEE_ADMIN",
      "ACCOUNTANT",
    ].includes(user.role)

  /* -------------------------------------------------------------------------- */
  /*                                 Collections                                */
  /* -------------------------------------------------------------------------- */

  const collections =
    await getAllCollections()

  /* -------------------------------------------------------------------------- */
  /*                               Bank Accounts                                */
  /* -------------------------------------------------------------------------- */

  const accounts = isAdminOrAccountant
    ? await getBankAccounts()
    : []

  /* -------------------------------------------------------------------------- */
  /*                                  Summary                                   */
  /* -------------------------------------------------------------------------- */

  const pending = collections.filter((c) =>
    ["COLLECTED", "DEPOSITED"].includes(
      c.status
    )
  )

  const verified = collections.filter(
    (c) => c.status === "VERIFIED"
  )

  const discrepant = collections.filter(
    (c) => c.status === "DISCREPANT"
  )

  const totalPending = pending.reduce(
    (s, c) => s + c.collectedAmount,
    0
  )

  const totalVerified = verified.reduce(
    (s, c) =>
      s +
      (c.verifiedAmount ??
        c.collectedAmount),
    0
  )

  const recollectionRequired =
    discrepant.reduce((s, c) => {
      const verified =
        c.verifiedAmount ?? 0

      return (
        s +
        (c.collectedAmount - verified)
      )
    }, 0)

  return (
    <div className="flex flex-col gap-6">
      {/* ---------------------------------------------------------------------- */}
      {/* Header                                                                 */}
      {/* ---------------------------------------------------------------------- */}

      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {isAdminOrAccountant
            ? "Member Collections"
            : "My Collections"}
        </h1>

        <p className="text-muted-foreground">
          Collection, verification and
          recollection tracking.
        </p>
      </div>

      {/* ---------------------------------------------------------------------- */}
      {/* Summary Cards                                                          */}
      {/* ---------------------------------------------------------------------- */}

      <div className="grid gap-4 md:grid-cols-3">
        {/* Pending */}

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Pending Verification
            </CardTitle>
          </CardHeader>

          <CardContent>
            <p className="text-2xl font-bold text-amber-600">
              ₹
              {totalPending.toLocaleString(
                "en-IN",
                {
                  minimumFractionDigits: 2,
                }
              )}
            </p>

            <p className="text-xs text-muted-foreground">
              {pending.length} entries
            </p>
          </CardContent>
        </Card>

        {/* Verified */}

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Verified Deposits
            </CardTitle>
          </CardHeader>

          <CardContent>
            <p className="text-2xl font-bold text-green-600">
              ₹
              {totalVerified.toLocaleString(
                "en-IN",
                {
                  minimumFractionDigits: 2,
                }
              )}
            </p>

            <p className="text-xs text-muted-foreground">
              {verified.length} entries
            </p>
          </CardContent>
        </Card>

        {/* Recollection */}

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Recollection Required
            </CardTitle>
          </CardHeader>

          <CardContent>
            <p className="text-2xl font-bold text-red-600">
              ₹
              {recollectionRequired.toLocaleString(
                "en-IN",
                {
                  minimumFractionDigits: 2,
                }
              )}
            </p>

            <p className="text-xs text-muted-foreground">
              {discrepant.length} discrepancies
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ---------------------------------------------------------------------- */}
      {/* Table                                                                  */}
      {/* ---------------------------------------------------------------------- */}

      <Card>
        <CardHeader>
          <CardTitle>
            {isAdminOrAccountant
              ? "All Collections"
              : "My Collections"}
          </CardTitle>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>

                <TableHead>
                  Member
                </TableHead>

                <TableHead>
                  Donor / Receipt
                </TableHead>

                <TableHead>
                  Collected (₹)
                </TableHead>

                <TableHead>
                  Verified (₹)
                </TableHead>

                <TableHead>
                  Shortage (₹)
                </TableHead>

                <TableHead>
                  Deposited To
                </TableHead>

                <TableHead>Status</TableHead>

                <TableHead>
                  Verified By
                </TableHead>

                <TableHead className="text-right">
                  Action
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {collections.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={10}
                    className="h-24 text-center text-muted-foreground"
                  >
                    No collections found.
                  </TableCell>
                </TableRow>
              ) : (
                collections.map((c) => {
                  const verifiedAmount =
                    c.verifiedAmount ??
                    c.collectedAmount

                  const shortage =
                    c.status === "DISCREPANT"
                      ? c.collectedAmount -
                        verifiedAmount
                      : 0

                  return (
                    <TableRow key={c.id}>
                      {/* Date */}

                      <TableCell className="text-sm">
                        {format(
                          c.collectedDate,
                          "dd MMM yy"
                        )}
                      </TableCell>

                      {/* Member */}

                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">
                            {c.member.name}
                          </p>

                          <p className="text-xs text-muted-foreground">
                            {
                              c.member.memberId
                            }
                          </p>
                        </div>
                      </TableCell>

                      {/* Donor */}

                      <TableCell>
                        <div>
                          <p className="text-sm">
                            {
                              c.donation
                                .donorName
                            }
                          </p>

                          <p className="text-xs text-muted-foreground">
                            {
                              c.donation
                                .receiptNo
                            }
                          </p>
                        </div>
                      </TableCell>

                      {/* Collected */}

                      <TableCell className="font-bold">
                        ₹
                        {c.collectedAmount.toLocaleString(
                          "en-IN",
                          {
                            minimumFractionDigits: 2,
                          }
                        )}
                      </TableCell>

                      {/* Verified */}

                      <TableCell className="font-medium">
                        ₹
                        {verifiedAmount.toLocaleString(
                          "en-IN",
                          {
                            minimumFractionDigits: 2,
                          }
                        )}
                      </TableCell>

                      {/* Shortage */}

                      <TableCell>
                        {shortage > 0 ? (
                          <span className="font-bold text-red-600">
                            ₹
                            {shortage.toLocaleString(
                              "en-IN",
                              {
                                minimumFractionDigits: 2,
                              }
                            )}
                          </span>
                        ) : (
                          "—"
                        )}
                      </TableCell>

                      {/* Deposited To */}

                      <TableCell className="text-sm text-muted-foreground">
                        {c
                          .depositedToAccount
                          ?.name ?? "—"}
                      </TableCell>

                      {/* Status */}

                      <TableCell>
                        <Badge
                          variant={
                            statusColors[
                              c.status
                            ] ?? "outline"
                          }
                        >
                          {c.status}
                        </Badge>
                      </TableCell>

                      {/* Verified By */}

                      <TableCell className="text-sm text-muted-foreground">
                        {c.verifiedBy
                          ?.name ?? "—"}
                      </TableCell>

                      {/* Actions */}

                      <TableCell className="text-right">
                        {/* Deposit */}

                        {isAdminOrAccountant &&
                          c.status ===
                            "COLLECTED" && (
                            <DepositCollectionButton
                              collectionId={
                                c.id
                              }
                              accounts={
                                accounts
                              }
                            />
                          )}

                        {/* Verify */}

                        {isAdminOrAccountant &&
                          [
                            "DEPOSITED",
                            "COLLECTED",
                          ].includes(
                            c.status
                          ) && (
                            <div className="ml-2 inline-block">
                              <VerifyCollectionButton
                                collectionId={
                                  c.id
                                }
                                collectedAmount={
                                  c.collectedAmount
                                }
                              />
                            </div>
                          )}

                        {/* Recollect */}

                        {isAdminOrAccountant &&
                          c.status ===
                            "DISCREPANT" && (
                            <div className="ml-2 inline-block">
                              <DepositCollectionButton
                                collectionId={
                                  c.id
                                }
                                accounts={
                                  accounts
                                }
                                recollectMode
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
      </Card>
    </div>
  )
}
