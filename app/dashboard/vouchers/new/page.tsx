import { Metadata } from "next";
import VoucherForm from "@/components/vouchers/voucher-form";

export const metadata: Metadata = {
  title: "Create Voucher | Mandir Accounting",
  description: "Create a new accounting voucher",
};

export default function NewVoucherPage() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Create Voucher</h1>
        <p className="text-sm text-muted-foreground">
          Create a new Cash Entry, Payment, Collection, or Journal voucher
        </p>
      </div>
      <VoucherForm />
    </div>
  );
}
