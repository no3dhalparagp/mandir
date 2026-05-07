"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, ArrowUpCircle } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
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

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { createFundTransfer } from "@/app/dashboard/bank/transfers/actions";

const schema = z.object({
  fromAccountId: z.string().min(1, "Select source cash account"),
  toAccountId: z.string().min(1, "Select target bank account"),
  amount: z.coerce.number().min(1, "Amount must be greater than 0"),
  referenceNo: z.string().optional(),
  notes: z.string().optional(),
});

// Use input type for RHF
type FormData = z.input<typeof schema>;

interface Account {
  id: string;
  name: string;
  accountType: string;
  currentBalance?: number;
}

interface DepositCashDialogProps {
  accounts: Account[];
}

export function DepositCashDialog({ accounts }: DepositCashDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [pending, startTransition] = React.useTransition();

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      fromAccountId: "",
      toAccountId: "",
      amount: 0,
      referenceNo: "",
      notes: "",
    },
  });

  // Filter account types
  const cashAccounts = accounts.filter((a) => a.accountType === "CASH_IN_HAND");

  const bankAccounts = accounts.filter((a) => a.accountType !== "CASH_IN_HAND");

  const cannotSubmit = cashAccounts.length === 0 || bankAccounts.length === 0;

  const onSubmit = async (data: FormData) => {
    startTransition(async () => {
      try {
        const validated = schema.parse(data);
        const res = await createFundTransfer(validated);

        if (res?.error) {
          toast.error(res.error);
          return;
        }

        toast.success("Cash deposited successfully!");

        form.reset({
          fromAccountId: "",
          toAccountId: "",
          amount: 0,
          referenceNo: "",
          notes: "",
        });

        setOpen(false);

        window.location.reload();
      } catch (error) {
        console.error(error);
        toast.error("Something went wrong");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <Button variant="outline" className="gap-2">
          <ArrowUpCircle className="h-4 w-4 text-green-600" />
          Deposit Cash
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>Deposit Cash to Bank</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 mt-2"
          >
            {/* From Cash Account */}
            <FormField
              control={form.control}
              name="fromAccountId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>From Cash Account *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select cash account" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {cashAccounts.length === 0 ? (
                        <SelectItem value="__none" disabled>
                          No cash accounts found
                        </SelectItem>
                      ) : (
                        cashAccounts.map((a) => (
                          <SelectItem key={a.id} value={a.id}>
                            {a.name} ( Bal: ₹
                            {a.currentBalance?.toLocaleString("en-IN") || "0"})
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* To Bank Account */}
            <FormField
              control={form.control}
              name="toAccountId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Deposit To Bank Account *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select bank account" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {bankAccounts.length === 0 ? (
                        <SelectItem value="__none" disabled>
                          No bank accounts found
                        </SelectItem>
                      ) : (
                        bankAccounts.map((a) => (
                          <SelectItem key={a.id} value={a.id}>
                            {a.name} ( Bal: ₹
                            {a.currentBalance?.toLocaleString("en-IN") || "0"})
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Amount */}
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount (₹) *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="1"
                      value={field.value as number | ""}
                      onChange={(e) => field.onChange(e.target.value)}
                      onBlur={field.onBlur}
                      name={field.name}
                      ref={field.ref}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Reference */}
            <FormField
              control={form.control}
              name="referenceNo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Deposit Slip / Reference No.</FormLabel>
                  <FormControl>
                    <Input placeholder="Optional" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Input placeholder="Optional" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Submit */}
            <Button
              type="submit"
              className="w-full"
              disabled={pending || cannotSubmit}
            >
              {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Deposit
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
