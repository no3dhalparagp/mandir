// File: app/dashboard/collections/page.tsx

import { getAllCollections } from "./actions"
import { getBankAccounts } from "@/app/dashboard/bank/actions"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { CollectionsTable } from "@/components/collections/collections-table"

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

  const collections = await getAllCollections()

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
    ["COLLECTED", "DEPOSITED"].includes(c.status)
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
      s + (c.verifiedAmount ?? c.collectedAmount),
    0
  )

  const recollectionRequired = discrepant.reduce(
    (s, c) => {
      const verified = c.verifiedAmount ?? 0
      return s + (c.collectedAmount - verified)
    },
    0
  )

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
          Collection, verification and recollection tracking.
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
              {totalPending.toLocaleString("en-IN", {
                minimumFractionDigits: 2,
              })}
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
              {totalVerified.toLocaleString("en-IN", {
                minimumFractionDigits: 2,
              })}
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
              {recollectionRequired.toLocaleString("en-IN", {
                minimumFractionDigits: 2,
              })}
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
        <CollectionsTable
          collections={collections as any}
          accounts={accounts as any}
          isAdminOrAccountant={isAdminOrAccountant}
        />
      </Card>
    </div>
  )
}
