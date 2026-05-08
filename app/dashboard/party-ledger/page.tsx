import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import PartyLedgerList from "@/components/party/party-ledger-list";

export const metadata: Metadata = {
  title: "Party Ledger | Mandir Accounting",
  description: "View and manage party/vendor ledgers",
};

export default function PartyLedgerPage() {
  return (
    <div className="flex h-full flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Party Ledger</h1>
            <p className="text-sm text-muted-foreground">
              Manage all parties, vendors, and member accounts
            </p>
          </div>
          <Link href="/dashboard/party-ledger/new">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New Party
            </Button>
          </Link>
        </div>
      </div>

      {/* Party Ledger List */}
      <PartyLedgerList />
    </div>
  );
}
