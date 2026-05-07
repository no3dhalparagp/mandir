"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Filter } from "lucide-react";
import { formatINR, formatDate } from "@/lib/utils";

interface Voucher {
  id: string;
  voucherNo: string;
  voucherType: string;
  voucherDate: string;
  description: string;
  totalAmount: number;
  status: string;
  partyName?: string;
}

export default function VouchersList() {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  useEffect(() => {
    const fetchVouchers = async () => {
      try {
        const params = new URLSearchParams();
        if (typeFilter !== "ALL") params.append("type", typeFilter);
        if (statusFilter !== "ALL") params.append("status", statusFilter);

        const response = await fetch(`/api/vouchers?${params}`);
        if (response.ok) {
          const data = await response.json();
          setVouchers(data.vouchers);
        }
      } catch (error) {
        console.error("[v0] Failed to fetch vouchers:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchVouchers();
  }, [typeFilter, statusFilter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "POSTED":
        return "bg-green-100 text-green-800";
      case "DRAFT":
        return "bg-yellow-100 text-yellow-800";
      case "CANCELLED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getVoucherTypeColor = (type: string) => {
    switch (type) {
      case "CASH_ENTRY":
        return "bg-blue-100 text-blue-800";
      case "PAYMENT":
        return "bg-purple-100 text-purple-800";
      case "COLLECTION":
        return "bg-cyan-100 text-cyan-800";
      case "JOURNAL":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading vouchers...</div>;
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Filters */}
      <div className="flex gap-4 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="text-sm font-medium mb-2 block">Type</label>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Types</SelectItem>
              <SelectItem value="CASH_ENTRY">Cash Entry</SelectItem>
              <SelectItem value="PAYMENT">Payment</SelectItem>
              <SelectItem value="COLLECTION">Collection</SelectItem>
              <SelectItem value="JOURNAL">Journal</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 min-w-[200px]">
          <label className="text-sm font-medium mb-2 block">Status</label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Status</SelectItem>
              <SelectItem value="DRAFT">Draft</SelectItem>
              <SelectItem value="POSTED">Posted</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Voucher No</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Party/Description</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {vouchers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No vouchers found
                </TableCell>
              </TableRow>
            ) : (
              vouchers.map((voucher) => (
                <TableRow key={voucher.id}>
                  <TableCell className="font-medium">{voucher.voucherNo}</TableCell>
                  <TableCell>
                    <Badge className={getVoucherTypeColor(voucher.voucherType)}>
                      {voucher.voucherType.replace(/_/g, " ")}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(new Date(voucher.voucherDate))}</TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm font-medium">{voucher.partyName || "—"}</p>
                      <p className="text-xs text-muted-foreground">{voucher.description}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatINR(voucher.totalAmount)}
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(voucher.status)}>
                      {voucher.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/dashboard/vouchers/${voucher.id}`}>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
