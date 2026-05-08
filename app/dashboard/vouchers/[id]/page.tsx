import { Metadata } from "next";
import { notFound } from "next/navigation";
import VoucherDetail from "@/components/vouchers/voucher-detail";

export const metadata: Metadata = {
  title: "Voucher Details | Mandir Accounting",
  description: "View and manage voucher details",
};

interface VoucherDetailPageProps {
  params: { id: string };
}

export default async function VoucherDetailPage({
  params,
}: VoucherDetailPageProps) {
  return (
    <div className="flex flex-col gap-8">
      <VoucherDetail voucherId={params.id} />
    </div>
  );
}
