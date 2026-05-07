import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import VouchersList from "@/components/vouchers/vouchers-list";

export const metadata: Metadata = {
  title: "Vouchers | Mandir Accounting",
  description: "Manage all vouchers - Cash Entry, Payment, Collection, Journal",
};

export default function VouchersPage() {
  return (
    <div className="flex h-full flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Vouchers</h1>
            <p className="text-sm text-muted-foreground">
              Create and manage all types of vouchers
            </p>
          </div>
          <Link href="/dashboard/vouchers/new">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New Voucher
            </Button>
          </Link>
        </div>
      </div>

      {/* Vouchers List */}
      <VouchersList />
    </div>
  );
}
