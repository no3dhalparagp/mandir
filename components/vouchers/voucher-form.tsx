"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Trash2, Plus } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatINR } from "@/lib/utils";

const voucherFormSchema = z.object({
  voucherType: z.string().min(1, "Select voucher type"),
  voucherDate: z.string(),
  description: z.string().optional(),
  partyName: z.string().optional(),
  totalAmount: z.string(),
  paymentMode: z.string().default("CASH"),
  accountId: z.string().optional(),
  notes: z.string().optional(),
});

interface LineItem {
  id: string;
  accountId: string;
  accountName: string;
  entryType: "DEBIT" | "CREDIT";
  amount: string;
}

interface ChartOfAccount {
  id: string;
  code: string;
  name: string;
  type: string;
}

export default function VoucherForm() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<ChartOfAccount[]>([]);
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<z.infer<typeof voucherFormSchema>>({
    resolver: zodResolver(voucherFormSchema),
    defaultValues: {
      voucherType: "",
      voucherDate: new Date().toISOString().split("T")[0],
      description: "",
      paymentMode: "CASH",
    },
  });

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const response = await fetch("/api/coa");
        if (response.ok) {
          const data = await response.json();
          setAccounts(data);
        }
      } catch (error) {
        console.error("[v0] Failed to fetch accounts:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAccounts();
  }, []);

  const addLineItem = () => {
    setLineItems([
      ...lineItems,
      {
        id: Math.random().toString(),
        accountId: "",
        accountName: "",
        entryType: "DEBIT",
        amount: "",
      },
    ]);
  };

  const removeLineItem = (id: string) => {
    setLineItems(lineItems.filter((item) => item.id !== id));
  };

  const updateLineItem = (
    id: string,
    field: string,
    value: string | number
  ) => {
    setLineItems(
      lineItems.map((item) => {
        if (item.id === id) {
          if (field === "accountId") {
            const account = accounts.find((a) => a.id === value);
            return {
              ...item,
              accountId: value as string,
              accountName: account?.name || "",
            };
          }
          return { ...item, [field]: value };
        }
        return item;
      })
    );
  };

  const totalDebit = lineItems
    .filter((item) => item.entryType === "DEBIT")
    .reduce((sum, item) => sum + parseFloat(item.amount || "0"), 0);

  const totalCredit = lineItems
    .filter((item) => item.entryType === "CREDIT")
    .reduce((sum, item) => sum + parseFloat(item.amount || "0"), 0);

  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;

  async function onSubmit(values: z.infer<typeof voucherFormSchema>) {
    if (lineItems.length === 0) {
      alert("Add at least one line item");
      return;
    }

    if (!isBalanced) {
      alert("Voucher must be balanced (Debit = Credit)");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/vouchers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          totalAmount: totalDebit,
          lineItems: lineItems.map((item) => ({
            accountId: item.accountId,
            entryType: item.entryType,
            amount: item.amount,
          })),
        }),
      });

      if (response.ok) {
        const voucher = await response.json();
        router.push(`/dashboard/vouchers/${voucher.id}`);
      } else {
        alert("Failed to create voucher");
      }
    } catch (error) {
      console.error("[v0] Error creating voucher:", error);
      alert("Error creating voucher");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading form...</div>;
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {/* Basic Details */}
      <Card>
        <CardHeader>
          <CardTitle>Voucher Details</CardTitle>
          <CardDescription>Enter basic voucher information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="voucherType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Voucher Type *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="CASH_ENTRY">Cash Entry</SelectItem>
                      <SelectItem value="PAYMENT">Payment</SelectItem>
                      <SelectItem value="COLLECTION">Collection</SelectItem>
                      <SelectItem value="JOURNAL">Journal</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="voucherDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date *</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Input placeholder="Brief description of the voucher" {...field} />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="partyName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Party/Vendor Name</FormLabel>
                <FormControl>
                  <Input placeholder="Optional party details" {...field} />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="paymentMode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Payment Mode</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="CASH">Cash</SelectItem>
                    <SelectItem value="CHEQUE">Cheque</SelectItem>
                    <SelectItem value="UPI">UPI</SelectItem>
                    <SelectItem value="NEFT">NEFT</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notes</FormLabel>
                <FormControl>
                  <Textarea placeholder="Additional notes" {...field} />
                </FormControl>
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      {/* Line Items */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Line Items</CardTitle>
            <CardDescription>Add debit and credit entries</CardDescription>
          </div>
          <Button type="button" onClick={addLineItem} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {lineItems.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No line items added. Click "Add Item" to begin.
            </p>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Account</TableHead>
                    <TableHead>Debit</TableHead>
                    <TableHead>Credit</TableHead>
                    <TableHead className="w-10">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lineItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Select
                          value={item.accountId}
                          onValueChange={(val) =>
                            updateLineItem(item.id, "accountId", val)
                          }
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select account" />
                          </SelectTrigger>
                          <SelectContent>
                            {accounts.map((acc) => (
                              <SelectItem key={acc.id} value={acc.id}>
                                {acc.code} - {acc.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        {item.entryType === "DEBIT" ? (
                          <Input
                            type="number"
                            step="0.01"
                            value={item.amount}
                            onChange={(e) =>
                              updateLineItem(item.id, "amount", e.target.value)
                            }
                            placeholder="0.00"
                          />
                        ) : (
                          <div className="text-center text-muted-foreground">—</div>
                        )}
                      </TableCell>
                      <TableCell>
                        {item.entryType === "CREDIT" ? (
                          <Input
                            type="number"
                            step="0.01"
                            value={item.amount}
                            onChange={(e) =>
                              updateLineItem(item.id, "amount", e.target.value)
                            }
                            placeholder="0.00"
                          />
                        ) : (
                          <div className="text-center text-muted-foreground">—</div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeLineItem(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Balance Summary */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t">
            <div className="bg-blue-50 p-4 rounded">
              <p className="text-xs text-muted-foreground">Total Debit</p>
              <p className="text-lg font-bold">{formatINR(totalDebit)}</p>
            </div>
            <div className="bg-blue-50 p-4 rounded">
              <p className="text-xs text-muted-foreground">Total Credit</p>
              <p className="text-lg font-bold">{formatINR(totalCredit)}</p>
            </div>
            <div
              className={`p-4 rounded ${
                isBalanced ? "bg-green-50" : "bg-red-50"
              }`}
            >
              <p className="text-xs text-muted-foreground">Status</p>
              <p
                className={`text-lg font-bold ${
                  isBalanced ? "text-green-600" : "text-red-600"
                }`}
              >
                {isBalanced ? "✓ Balanced" : "✗ Not Balanced"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Submit */}
      <div className="flex gap-4">
        <Button type="submit" disabled={submitting || !isBalanced}>
          {submitting ? "Creating..." : "Create Voucher"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
