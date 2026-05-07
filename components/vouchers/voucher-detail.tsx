"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, CheckCircle2, Trash2 } from "lucide-react";
import Link from "next/link";
import { formatINR, formatDate } from "@/lib/utils";

interface LineItem {
  id: string;
  accountId: string;
  account: {
    code: string;
    name: string;
  };
  entryType: string;
  amount: number;
  description?: string;
}

interface Voucher {
  id: string;
  voucherNo: string;
  voucherType: string;
  voucherDate: string;
  description?: string;
  partyName?: string;
  totalAmount: number;
  status: string;
  paymentMode: string;
  notes?: string;
  lineItems: LineItem[];
  createdBy?: {
    name?: string;
    email: string;
  };
  createdAt: string;
}

interface VoucherDetailProps {
  voucherId: string;
}

export default function VoucherDetail({ voucherId }: VoucherDetailProps) {
  const router = useRouter();
  const [voucher, setVoucher] = useState<Voucher | null>(null);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    const fetchVoucher = async () => {
      try {
        const response = await fetch(`/api/vouchers/${voucherId}`);
        if (response.ok) {
          const data = await response.json();
          setVoucher(data);
        }
      } catch (error) {
        console.error("[v0] Failed to fetch voucher:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchVoucher();
  }, [voucherId]);

  const handlePost = async () => {
    if (!voucher) return;

    setPosting(true);
    try {
      const response = await fetch(`/api/vouchers/${voucherId}/post`, {
        method: "POST",
      });

      if (response.ok) {
        const data = await response.json();
        setVoucher(data.voucher);
        alert("Voucher posted successfully!");
      } else {
        alert("Failed to post voucher");
      }
    } catch (error) {
      console.error("[v0] Error posting voucher:", error);
      alert("Error posting voucher");
    } finally {
      setPosting(false);
    }
  };

  const handleCancel = async () => {
    if (!voucher) return;

    if (!confirm("Are you sure you want to cancel this voucher?")) return;

    try {
      const response = await fetch(`/api/vouchers/${voucherId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        router.push("/dashboard/vouchers");
      } else {
        alert("Failed to cancel voucher");
      }
    } catch (error) {
      console.error("[v0] Error cancelling voucher:", error);
      alert("Error cancelling voucher");
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading voucher...</div>;
  }

  if (!voucher) {
    return <div className="text-center py-8">Voucher not found</div>;
  }

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

  const totalDebit = voucher.lineItems
    .filter((item) => item.entryType === "DEBIT")
    .reduce((sum, item) => sum + item.amount, 0);

  const totalCredit = voucher.lineItems
    .filter((item) => item.entryType === "CREDIT")
    .reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link href="/dashboard/vouchers">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div className="flex gap-2">
          {voucher.status === "DRAFT" && (
            <>
              <Button onClick={handlePost} disabled={posting} className="gap-2">
                <CheckCircle2 className="h-4 w-4" />
                {posting ? "Posting..." : "Post to GL"}
              </Button>
              <Button
                variant="destructive"
                onClick={handleCancel}
                className="gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Cancel
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Voucher Info */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                {voucher.voucherNo}
                <Badge className={getVoucherTypeColor(voucher.voucherType)}>
                  {voucher.voucherType.replace(/_/g, " ")}
                </Badge>
                <Badge className={getStatusColor(voucher.status)}>
                  {voucher.status}
                </Badge>
              </CardTitle>
              <CardDescription>{voucher.description}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Date</p>
              <p className="font-medium">
                {formatDate(new Date(voucher.voucherDate))}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Payment Mode</p>
              <p className="font-medium">{voucher.paymentMode}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Created By</p>
              <p className="font-medium">
                {voucher.createdBy?.name || "System"}
              </p>
            </div>
          </div>

          {voucher.partyName && (
            <div>
              <p className="text-xs text-muted-foreground">Party/Vendor</p>
              <p className="font-medium">{voucher.partyName}</p>
            </div>
          )}

          {voucher.notes && (
            <div>
              <p className="text-xs text-muted-foreground">Notes</p>
              <p className="text-sm">{voucher.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Line Items */}
      <Card>
        <CardHeader>
          <CardTitle>Line Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Account</TableHead>
                  <TableHead className="text-right">Debit</TableHead>
                  <TableHead className="text-right">Credit</TableHead>
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {voucher.lineItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      <div>
                        <p className="font-semibold">{item.account.code}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.account.name}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {item.entryType === "DEBIT"
                        ? formatINR(item.amount)
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {item.entryType === "CREDIT"
                        ? formatINR(item.amount)
                        : "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {item.description || "—"}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="border-t-2 bg-muted/50 font-semibold">
                  <TableCell>TOTAL</TableCell>
                  <TableCell className="text-right font-mono">
                    {formatINR(totalDebit)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatINR(totalCredit)}
                  </TableCell>
                  <TableCell></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
