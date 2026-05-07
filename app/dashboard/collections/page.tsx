// File: app/dashboard/collections/page.tsx

import {
  getAllCollections,
  getCollectionsByCollector,
} from "./actions"

import { getBankAccounts } from "@/app/dashboard/bank/actions"

import { auth } from "@/auth"

import { prisma } from "@/lib/prisma"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import {
  CollectionsTable,
  CollectionWithFlags,
  CollectionsBankAccount,
} from "@/components/collections/collections-table"

import { AgentCollectionsOverview } from "@/components/collections/agent-collections-overview"

export default async function CollectionsPage() {
  const session = await auth()

  const user =
    session?.user?.id
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

  /* -------------------------------------------------------- */
  /* COLLECTIONS                                              */
  /* -------------------------------------------------------- */

  const collections =
    await getAllCollections()

  /* -------------------------------------------------------- */
  /* AGENT COLLECTIONS                                        */
  /* -------------------------------------------------------- */

  const agentCollections =
    isAdminOrAccountant
      ? await getCollectionsByCollector()
      : []

  /* -------------------------------------------------------- */
  /* BANK ACCOUNTS                                            */
  /* -------------------------------------------------------- */

  const accounts =
    isAdminOrAccountant
      ? await getBankAccounts()
      : []

  /* -------------------------------------------------------- */
  /* SUMMARY                                                  */
  /* -------------------------------------------------------- */

  const pendingCollections =
    collections.filter((c) =>
      [
        "COLLECTED",
        "DEPOSITED",
      ].includes(c.status)
    )

  const verifiedCollections =
    collections.filter(
      (c) =>
        c.status ===
        "VERIFIED"
    )

  const discrepantCollections =
    collections.filter(
      (c) =>
        c.status ===
        "DISCREPANT"
    )

  const totalPending =
    pendingCollections.reduce(
      (sum, c) =>
        sum + c.collectedAmount,
      0
    )

  const totalVerified =
    verifiedCollections.reduce(
      (sum, c) =>
        sum +
        (
          c.verifiedAmount ??
          c.collectedAmount
        ),
      0
    )

  const totalRecollection =
    discrepantCollections.reduce(
      (sum, c) => {
        const verified =
          c.verifiedAmount ?? 0

        return (
          sum +
          (
            c.collectedAmount -
            verified
          )
        )
      },
      0
    )

  /* -------------------------------------------------------- */
  /* CASH VS CHEQUE                                           */
  /* -------------------------------------------------------- */

  const cashCollections =
    collections.filter(
      (c) =>
        c
          .depositedToAccount
          ?.accountType ===
        "CASH_IN_HAND"
    )

  const chequeCollections =
    collections.filter(
      (c) =>
        c
          .depositedToAccount
          ?.accountType !==
        "CASH_IN_HAND"
    )

  const totalCash =
    cashCollections.reduce(
      (sum, c) =>
        sum +
        (
          c.verifiedAmount ??
          c.collectedAmount
        ),
      0
    )

  const totalCheque =
    chequeCollections.reduce(
      (sum, c) =>
        sum +
        (
          c.verifiedAmount ??
          c.collectedAmount
        ),
      0
    )

  return (
    <div className="flex flex-col gap-6">
      {/* ---------------------------------------------------- */}
      {/* PAGE HEADER                                          */}
      {/* ---------------------------------------------------- */}

      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {isAdminOrAccountant
            ? "Member Collections"
            : "My Collections"}
        </h1>

        <p className="text-muted-foreground">
          Collection verification,
          cheque clearance and
          recollection tracking.
        </p>
      </div>

      {/* ---------------------------------------------------- */}
      {/* AGENT COLLECTIONS                                    */}
      {/* ---------------------------------------------------- */}

      {isAdminOrAccountant &&
        agentCollections.length >
          0 && (
          <AgentCollectionsOverview
            collectorData={
              agentCollections
            }
            accounts={
              accounts as CollectionsBankAccount[]
            }
          />
        )}

      {/* ---------------------------------------------------- */}
      {/* SUMMARY CARDS                                        */}
      {/* ---------------------------------------------------- */}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {/* PENDING */}

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
              {
                pendingCollections.length
              }{" "}
              entries
            </p>
          </CardContent>
        </Card>

        {/* VERIFIED */}

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Verified Collections
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
              {
                verifiedCollections.length
              }{" "}
              entries
            </p>
          </CardContent>
        </Card>

        {/* CASH */}

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Cash Collections
            </CardTitle>
          </CardHeader>

          <CardContent>
            <p className="text-2xl font-bold text-blue-600">
              ₹
              {totalCash.toLocaleString(
                "en-IN",
                {
                  minimumFractionDigits: 2,
                }
              )}
            </p>

            <p className="text-xs text-muted-foreground">
              {
                cashCollections.length
              }{" "}
              entries
            </p>
          </CardContent>
        </Card>

        {/* CHEQUE */}

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Cheque Collections
            </CardTitle>
          </CardHeader>

          <CardContent>
            <p className="text-2xl font-bold text-purple-600">
              ₹
              {totalCheque.toLocaleString(
                "en-IN",
                {
                  minimumFractionDigits: 2,
                }
              )}
            </p>

            <p className="text-xs text-muted-foreground">
              {
                chequeCollections.length
              }{" "}
              entries
            </p>
          </CardContent>
        </Card>

        {/* RECOLLECTION */}

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Recollection Required
            </CardTitle>
          </CardHeader>

          <CardContent>
            <p className="text-2xl font-bold text-red-600">
              ₹
              {totalRecollection.toLocaleString(
                "en-IN",
                {
                  minimumFractionDigits: 2,
                }
              )}
            </p>

            <p className="text-xs text-muted-foreground">
              {
                discrepantCollections.length
              }{" "}
              discrepancies
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ---------------------------------------------------- */}
      {/* COLLECTION TABLE                                     */}
      {/* ---------------------------------------------------- */}

      <Card>
        <CollectionsTable
          collections={
            collections as CollectionWithFlags[]
          }
          accounts={
            accounts as CollectionsBankAccount[]
          }
          isAdminOrAccountant={
            isAdminOrAccountant
          }
        />
      </Card>
    </div>
  )
}
