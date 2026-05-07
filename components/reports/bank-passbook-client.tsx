"use client";

import React, { useState, useMemo } from "react";
import { format } from "date-fns";
import { Calendar, Download, CheckCircle, Clock } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

interface BankAccount {
  id: string;
  name: string;
  bankName?: string;
  accountNumber?: string;
  accountType: string;
}

interface DepositVerification {
  id: string;
  depositAmount: number;
  depositDate: string;
  status: string;
  collectedByName?: string;
  member?: { name: string; memberId: string };
  bankAccount: { id: string; name: string };
  receiptNo?: string;
  notes?: string;
  verifiedAt?: string;
}

interface BankPassbookClientProps {
  bankAccounts: BankAccount[];
  depositVerifications: DepositVerification[];
  userRole: string;
}

export function BankPassbookClient({
  bankAccounts,
  depositVerifications,
  userRole,
}: BankPassbookClientProps) {
  const [selectedAccountId, setSelectedAccountId] = useState<string>(
    bankAccounts.length > 0 ? bankAccounts[0].id : ""
  );
  const [startDate, setStartDate] = useState<string>(
    format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), "yyyy-MM-dd")
  );
  const [endDate, setEndDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));

  // Filter bank passbook entries for selected account
  const filteredDeposits = useMemo(() => {
    return depositVerifications.filter((dep) => {
      const depDate = new Date(dep.depositDate);
      const start = new Date(startDate);
      const end = new Date(endDate);

      return (
        dep.bankAccount.id === selectedAccountId &&
        depDate >= start &&
        depDate <= end
      );
    });
  }, [selectedAccountId, startDate, endDate, depositVerifications]);

  const selectedAccount = bankAccounts.find((acc) => acc.id === selectedAccountId);

  // Calculate totals
  const totalDeposited = filteredDeposits.reduce(
    (sum, dep) => (dep.status !== "REJECTED" ? sum + dep.depositAmount : sum),
    0
  );

  const verifiedAmount = filteredDeposits
    .filter((dep) => dep.status === "VERIFIED")
    .reduce((sum, dep) => sum + dep.depositAmount, 0);

  const pendingAmount = filteredDeposits
    .filter((dep) => dep.status === "PENDING")
    .reduce((sum, dep) => sum + dep.depositAmount, 0);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadCSV = () => {
    const headers = [
      "Date",
      "Receipt No",
      "Collected By",
      "Amount",
      "Status",
      "Notes",
    ];
    const rows = filteredDeposits.map((dep) => [
      format(new Date(dep.depositDate), "dd-MMM-yyyy"),
      dep.receiptNo || "-",
      dep.collectedByName || dep.member?.name || "-",
      dep.depositAmount.toFixed(2),
      dep.status,
      dep.notes || "-",
    ]);

    const csv =
      [headers, ...rows]
        .map((row) =>
          row
            .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
            .join(",")
        )
        .join("\n") + "\n";

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${selectedAccount?.name}_passbook_${format(new Date(), "dd-MMM-yyyy")}.csv`;
    a.click();
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Bank Passbook</h1>
        <p className="text-muted-foreground">Track bank account deposits and verify collected amounts</p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <label className="text-sm font-medium">Bank Account</label>
              <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>
                  {bankAccounts.map((acc) => (
                    <SelectItem key={acc.id} value={acc.id}>
                      {acc.name}
                      {acc.accountNumber && ` (****${acc.accountNumber.slice(-4)})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Start Date</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">End Date</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div className="flex items-end gap-2">
              <Button onClick={handlePrint} variant="outline" size="sm" className="w-full">
                <Calendar className="h-4 w-4 mr-2" />
                Print
              </Button>
              <Button onClick={handleDownloadCSV} variant="outline" size="sm" className="w-full">
                <Download className="h-4 w-4 mr-2" />
                CSV
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Deposited</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              ₹{totalDeposited.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-muted-foreground mt-1">{filteredDeposits.length} deposits</p>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-700">Verified</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-700">
              ₹{verifiedAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-green-600 mt-1">
              {filteredDeposits.filter((d) => d.status === "VERIFIED").length} verified
            </p>
          </CardContent>
        </Card>

        <Card className="border-yellow-200 bg-yellow-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-yellow-700">Pending Verification</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-yellow-700">
              ₹{pendingAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-yellow-600 mt-1">
              {filteredDeposits.filter((d) => d.status === "PENDING").length} pending
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Passbook Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            {selectedAccount?.name || "Bank Account"} - Deposit History
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Receipt No</TableHead>
                <TableHead>Collected By</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDeposits.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No deposits found for selected period
                  </TableCell>
                </TableRow>
              ) : (
                filteredDeposits.map((deposit) => (
                  <TableRow key={deposit.id}>
                    <TableCell className="font-medium">
                      {format(new Date(deposit.depositDate), "dd MMM yyyy")}
                    </TableCell>
                    <TableCell className="text-sm">{deposit.receiptNo || "-"}</TableCell>
                    <TableCell className="text-sm">
                      {deposit.collectedByName || deposit.member?.name || "-"}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      ₹{deposit.depositAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          deposit.status === "VERIFIED"
                            ? "default"
                            : deposit.status === "PENDING"
                            ? "secondary"
                            : "destructive"
                        }
                        className="flex items-center gap-1 w-fit"
                      >
                        {deposit.status === "VERIFIED" && (
                          <CheckCircle className="h-3 w-3" />
                        )}
                        {deposit.status === "PENDING" && (
                          <Clock className="h-3 w-3" />
                        )}
                        {deposit.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                      {deposit.notes || "-"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Print Styles */}
      <style>{`
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            font-size: 12px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
          }
          th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
          }
          th {
            background-color: #f5f5f5;
            font-weight: bold;
          }
        }
      `}</style>
    </div>
  );
}
