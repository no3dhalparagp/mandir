import { getBankAccounts, getAccountBalance } from "./actions"
import { Building2, Plus, IndianRupee } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AddBankAccountDialog } from "@/components/bank/add-bank-account-dialog"
import { DepositCashDialog } from "@/components/bank/deposit-cash-dialog"
import { WithdrawCashDialog } from "@/components/bank/withdraw-cash-dialog"
import Link from "next/link"

export default async function BankAccountsPage() {
  const accounts = await getBankAccounts()

  // Compute balances for each account
  const accountsWithBalance = await Promise.all(
    accounts.map(async (acc) => ({
      ...acc,
      currentBalance: await getAccountBalance(acc.id),
    }))
  )

  const totalBalance = accountsWithBalance.reduce((s, a) => s + a.currentBalance, 0)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bank Accounts</h1>
          <p className="text-muted-foreground">
            Manage bank and cash accounts. Total balance across all accounts.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DepositCashDialog accounts={accountsWithBalance} />
          <WithdrawCashDialog accounts={accountsWithBalance} />
          <AddBankAccountDialog />
        </div>
      </div>

      {/* Summary Card */}
      <Card className="bg-primary text-primary-foreground">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium opacity-80">Total Balance (All Accounts)</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">₹{totalBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</p>
          <p className="text-sm opacity-70 mt-1">{accounts.length} account{accounts.length !== 1 ? "s" : ""}</p>
        </CardContent>
      </Card>

      {/* Account Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {accountsWithBalance.length === 0 ? (
          <Card className="col-span-3 flex flex-col items-center justify-center p-12 text-center">
            <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No bank accounts yet. Add your first account.</p>
          </Card>
        ) : (
          accountsWithBalance.map((account) => (
            <Card key={account.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2 flex flex-row items-start justify-between">
                <div>
                  <CardTitle className="text-base">{account.name}</CardTitle>
                  <CardDescription className="text-xs mt-0.5">
                    {account.bankName ? `${account.bankName}` : ""}
                    {account.accountNumber ? ` · ****${account.accountNumber.slice(-4)}` : ""}
                  </CardDescription>
                </div>
                <Badge variant={account.accountType === "CASH_IN_HAND" ? "secondary" : "outline"}>
                  {account.accountType.replace("_", " ")}
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-1">
                  <IndianRupee className="h-4 w-4 text-muted-foreground" />
                  <span className={`text-xl font-bold ${account.currentBalance < 0 ? "text-red-600" : "text-green-600"}`}>
                    {account.currentBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {account._count.ledgerEntries} transactions · {account._count.donations} donations
                </p>
                <Link
                  href={`/dashboard/bank/${account.id}`}
                  className="mt-3 inline-block text-xs font-medium text-primary hover:underline"
                >
                  View Ledger →
                </Link>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
