"use client";

import React, { useState, useMemo } from "react";
import { format } from "date-fns";
import { CheckCircle, XCircle, Clock, Plus } from "lucide-react";
import { toast } from "sonner";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

interface BankAccount {
  id: string;
  name: string;
  bankName?: string;
  accountNumber?: string;
}

interface Deposit {
  id: string;
  depositAmount: number;
  depositDate: string;
  status: string;
  collectedByName?: string;
  member?: { name: string; memberId: string };
  bankAccount: { id: string; name: string; bankName?: string };
  receiptNo?: string;
  notes?: string;
  verifiedAt?: string;
}

interface DepositVerificationClientProps {
  bankAccounts: BankAccount[];
  deposits: Deposit[];
}

const verifySchema = z.object({
  status: z.enum(["VERIFIED", "REJECTED"]),
  rejectionReason: z.string().optional(),
});

type VerifyFormData = z.infer<typeof verifySchema>;

const createDepositSchema = z.object({
  bankAccountId: z.string().min(1, "Bank account is required"),
  depositAmount: z.coerce.number().min(0.01, "Amount must be greater than 0"),
  collectedByName: z.string().optional(),
  receiptNo: z.string().optional(),
  notes: z.string().optional(),
});

type CreateDepositData = z.infer<typeof createDepositSchema>;

export function DepositVerificationClient({
  bankAccounts,
  deposits: initialDeposits,
}: DepositVerificationClientProps) {
  const [deposits, setDeposits] = useState(initialDeposits);
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("PENDING");
  const [verifyingDepositId, setVerifyingDepositId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const verifyForm = useForm<VerifyFormData>({
    resolver: zodResolver(verifySchema),
    defaultValues: { status: "VERIFIED", rejectionReason: "" },
  });

  const createForm = useForm<CreateDepositData>({
    resolver: zodResolver(createDepositSchema),
    defaultValues: {
      bankAccountId: bankAccounts[0]?.id || "",
      depositAmount: 0,
      collectedByName: "",
      receiptNo: "",
      notes: "",
    },
  });

  // Filter deposits
  const filteredDeposits = useMemo(() => {
    return deposits.filter((dep) => {
      const statusMatch = filterStatus === "ALL" || dep.status === filterStatus;
      const accountMatch = !selectedAccountId || dep.bankAccount.id === selectedAccountId;
      return statusMatch && accountMatch;
    });
  }, [deposits, selectedAccountId, filterStatus]);

  // Calculate summaries
  const pending = deposits.filter((d) => d.status === "PENDING").length;
  const verified = deposits.filter((d) => d.status === "VERIFIED").length;
  const pendingAmount = deposits
    .filter((d) => d.status === "PENDING")
    .reduce((sum, d) => sum + d.depositAmount, 0);

  const onVerify = async (depositId: string, data: VerifyFormData) => {
    try {
      const response = await fetch("/api/deposits/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          depositId,
          status: data.status,
          rejectionReason: data.rejectionReason,
        }),
      });

      if (!response.ok) throw new Error("Failed to verify deposit");

      const updated = await response.json();
      setDeposits((prev) =>
        prev.map((d) => (d.id === depositId ? { ...d, ...updated } : d))
      );

      toast.success(`Deposit ${data.status.toLowerCase()}!`);
      setVerifyingDepositId(null);
      verifyForm.reset();
    } catch (error) {
      toast.error("Failed to verify deposit");
    }
  };

  const onCreateDeposit = async (data: CreateDepositData) => {
    try {
      const response = await fetch("/api/deposits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          depositDate: new Date().toISOString(),
        }),
      });

      if (!response.ok) throw new Error("Failed to create deposit");

      const newDeposit = await response.json();
      setDeposits((prev) => [newDeposit, ...prev]);
      toast.success("Deposit created successfully");
      setCreateOpen(false);
      createForm.reset();
    } catch (error) {
      toast.error("Failed to create deposit");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Deposit Verification</h1>
          <p className="text-muted-foreground">Verify collected deposits and create bank transactions</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Create Deposit
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Deposit</DialogTitle>
            </DialogHeader>
            <Form {...createForm}>
              <form onSubmit={createForm.handleSubmit(onCreateDeposit)} className="space-y-4">
                <FormField
                  control={createForm.control}
                  name="bankAccountId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bank Account</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select account" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {bankAccounts.map((acc) => (
                            <SelectItem key={acc.id} value={acc.id}>
                              {acc.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="depositAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="0.00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="collectedByName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Collected By</FormLabel>
                      <FormControl>
                        <Input placeholder="Member or collector name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="receiptNo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Receipt No</FormLabel>
                      <FormControl>
                        <Input placeholder="Optional receipt number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Optional notes" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full">
                  Create Deposit
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-yellow-700">Pending Verification</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{pending}</p>
            <p className="text-xs text-muted-foreground mt-1">
              ₹{pendingAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-700">Verified</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{verified}</p>
            <p className="text-xs text-muted-foreground mt-1">Successfully verified</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Deposits</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{deposits.length}</p>
            <p className="text-xs text-muted-foreground mt-1">All deposits</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium">Bank Account</label>
              <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
                <SelectTrigger>
                  <SelectValue placeholder="All accounts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All accounts</SelectItem>
                  {bankAccounts.map((acc) => (
                    <SelectItem key={acc.id} value={acc.id}>
                      {acc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Status</label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="VERIFIED">Verified</SelectItem>
                  <SelectItem value="ALL">All</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Deposits Table */}
      <Card>
        <CardHeader>
          <CardTitle>Deposits</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Bank Account</TableHead>
                <TableHead>Collected By</TableHead>
                <TableHead>Receipt No</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDeposits.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No deposits found
                  </TableCell>
                </TableRow>
              ) : (
                filteredDeposits.map((deposit) => (
                  <TableRow key={deposit.id}>
                    <TableCell className="font-medium">
                      {format(new Date(deposit.depositDate), "dd MMM yyyy")}
                    </TableCell>
                    <TableCell className="text-sm">{deposit.bankAccount.name}</TableCell>
                    <TableCell className="text-sm">
                      {deposit.collectedByName || deposit.member?.name || "-"}
                    </TableCell>
                    <TableCell className="text-sm">{deposit.receiptNo || "-"}</TableCell>
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
                        {deposit.status === "VERIFIED" && <CheckCircle className="h-3 w-3" />}
                        {deposit.status === "PENDING" && <Clock className="h-3 w-3" />}
                        {deposit.status === "REJECTED" && <XCircle className="h-3 w-3" />}
                        {deposit.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {deposit.status === "PENDING" && (
                        <Dialog open={verifyingDepositId === deposit.id} onOpenChange={(open) => {
                          if (!open) setVerifyingDepositId(null);
                          else setVerifyingDepositId(deposit.id);
                        }}>
                          <DialogTrigger asChild>
                            <Button variant="sm" size="sm">
                              Verify
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-md">
                            <DialogHeader>
                              <DialogTitle>Verify Deposit</DialogTitle>
                            </DialogHeader>
                            <Form {...verifyForm}>
                              <form
                                onSubmit={verifyForm.handleSubmit((data) =>
                                  onVerify(deposit.id, data)
                                )}
                                className="space-y-4"
                              >
                                <FormField
                                  control={verifyForm.control}
                                  name="status"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Status</FormLabel>
                                      <Select value={field.value} onValueChange={field.onChange}>
                                        <FormControl>
                                          <SelectTrigger>
                                            <SelectValue />
                                          </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                          <SelectItem value="VERIFIED">Verify</SelectItem>
                                          <SelectItem value="REJECTED">Reject</SelectItem>
                                        </SelectContent>
                                      </Select>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                {verifyForm.watch("status") === "REJECTED" && (
                                  <FormField
                                    control={verifyForm.control}
                                    name="rejectionReason"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Reason</FormLabel>
                                        <FormControl>
                                          <Textarea placeholder="Why is this deposit rejected?" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                )}
                                <Button type="submit" className="w-full">
                                  Confirm
                                </Button>
                              </form>
                            </Form>
                          </DialogContent>
                        </Dialog>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
