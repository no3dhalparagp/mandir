"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { createBankAccount } from "@/app/dashboard/bank/actions";

const schema = z.object({
  name: z.string().min(2),
  accountNumber: z.string().optional(),
  bankName: z.string().optional(),
  branchName: z.string().optional(),
  ifscCode: z.string().optional(),
  accountType: z.enum(["SAVINGS", "CURRENT", "CASH_IN_HAND", "FIXED_DEPOSIT"]),
  openingBalance: z.coerce.number(),

  notes: z.string().optional(),
});

type FormData = z.input<typeof schema>;

export function AddBankAccountDialog() {
  const [open, setOpen] = React.useState(false);
  const [pending, startTransition] = React.useTransition();
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { accountType: "SAVINGS", openingBalance: 0 },
  });

  function onSubmit(data: FormData) {
    startTransition(async () => {
      const validated = schema.parse(data);
      const res = await createBankAccount(validated);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("Account created!");
        form.reset();
        setOpen(false);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <Plus className="mr-2 h-4 w-4" /> Add Account
      </DialogTrigger>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle>Add Bank / Cash Account</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 mt-2"
          >
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Account Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. SBI Main Account" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="accountType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Account Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="SAVINGS">Savings</SelectItem>
                        <SelectItem value="CURRENT">Current</SelectItem>
                        <SelectItem value="CASH_IN_HAND">
                          Cash in Hand
                        </SelectItem>
                        <SelectItem value="FIXED_DEPOSIT">
                          Fixed Deposit
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="openingBalance"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Opening Balance (₹)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
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
              <FormField
                control={form.control}
                name="bankName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bank Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. State Bank of India"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="branchName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Branch Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Main Branch" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="accountNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Account Number</FormLabel>
                    <FormControl>
                      <Input placeholder="Account number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="ifscCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>IFSC Code</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. SBIN0001234" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <Button type="submit" className="w-full" disabled={pending}>
              {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{" "}
              Save Account
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
