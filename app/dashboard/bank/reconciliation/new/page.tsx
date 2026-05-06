import { getBankAccounts } from "../../actions"
import { ReconciliationWizard } from "@/components/bank/reconciliation-wizard"

export default async function NewReconciliationPage() {
  const accounts = await getBankAccounts()
  
  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto w-full">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">New Bank Reconciliation</h1>
        <p className="text-muted-foreground">
          Step-by-step wizard to reconcile your physical bank statements with system ledger entries.
        </p>
      </div>

      <ReconciliationWizard accounts={accounts} />
    </div>
  )
}
