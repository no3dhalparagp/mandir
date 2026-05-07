"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import {
  CalendarIcon,
  Loader2,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

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
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

import {
  getUnreconciledEntries,
  submitReconciliation,
} from "@/app/dashboard/bank/reconciliation/actions";

const setupSchema = z.object({
  accountId: z.string().min(1, "Select an account"),
  statementFromDate: z.date(),
  statementToDate: z.date(),
  openingBalanceBank: z
    .number({
      error: "Opening balance is required",
    })
    .min(0, "Cannot be negative"),
  closingBalanceBank: z
    .number({
      error: "Closing balance is required",
    })
    .min(0, "Cannot be negative"),
  notes: z.string().optional(),
});

type SetupData = z.infer<typeof setupSchema>;

type LedgerEntry = Awaited<
  ReturnType<typeof getUnreconciledEntries>
>[number];

export function ReconciliationWizard({
  accounts,
}: {
  accounts: { id: string; name: string }[];
}) {
  const router = useRouter();

  const [step, setStep] = React.useState<1 | 2>(1);
  const [setupData, setSetupData] =
    React.useState<SetupData | null>(null);

  // Step 2 State
  const [entries, setEntries] = React.useState<LedgerEntry[]>([]);
  const [loadingEntries, setLoadingEntries] =
    React.useState(false);
  const [matchedIds, setMatchedIds] = React.useState<Set<string>>(
    new Set(),
  );
  const [isSubmitting, setIsSubmitting] =
    React.useState(false);

  const form = useForm<SetupData>({
    resolver: zodResolver(setupSchema),
    defaultValues: {
      statementFromDate: new Date(
        new Date().getFullYear(),
        new Date().getMonth() - 1,
        1,
      ),
      statementToDate: new Date(
        new Date().getFullYear(),
        new Date().getMonth(),
        0,
      ),
      openingBalanceBank: 0,
      closingBalanceBank: 0,
      notes: "",
    },
  });

  const fromDate = form.watch("statementFromDate");
  const toDate = form.watch("statementToDate");

  async function onSetupComplete(data: SetupData) {
    setSetupData(data);
    setLoadingEntries(true);
    setStep(2);

    try {
      const unrec = await getUnreconciledEntries(
        data.accountId,
        data.statementToDate,
      );

      setEntries(unrec);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load unreconciled entries");
    } finally {
      setLoadingEntries(false);
    }
  }

  function toggleMatch(id: string) {
    const next = new Set(matchedIds);

    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }

    setMatchedIds(next);
  }

  async function finishReconciliation() {
    if (!setupData) return;

    setIsSubmitting(true);

    try {
      const res = await submitReconciliation({
        ...setupData,
        matchedEntryIds: Array.from(matchedIds),
      });

      if (res.error) {
        toast.error(res.error);
        return;
      }

      toast.success(
        "Reconciliation completed successfully!",
      );

      router.push("/dashboard/bank/reconciliation");
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  // Step 2 Calculations
  const matchedTotal = entries
    .filter((e) => matchedIds.has(e.id))
    .reduce((sum, e) => {
      const isDebit = [
        "EXPENSE",
        "TRANSFER_OUT",
      ].includes(e.type);

      return isDebit
        ? sum - e.amount
        : sum + e.amount;
    }, 0);

  const calculatedClosing =
    (setupData?.openingBalanceBank || 0) +
    matchedTotal;

  const targetClosing =
    setupData?.closingBalanceBank || 0;

  const difference =
    calculatedClosing - targetClosing;

  // STEP 2
  if (step === 2) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>
            Match Ledger Entries
          </CardTitle>

          <CardDescription>
            Select the entries that appear on your
            physical bank statement to match the
            closing balance of ₹
            {targetClosing.toLocaleString("en-IN", {
              minimumFractionDigits: 2,
            })}
            .
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">
                Statement Opening
              </p>

              <p className="text-xl font-semibold">
                ₹
                {(
                  setupData?.openingBalanceBank || 0
                ).toLocaleString("en-IN")}
              </p>
            </div>

            <div className="bg-primary/10 p-4 rounded-lg border border-primary/20">
              <p className="text-sm text-primary">
                Calculated Closing
              </p>

              <p className="text-xl font-bold text-primary">
                ₹
                {calculatedClosing.toLocaleString(
                  "en-IN",
                )}
              </p>
            </div>

            <div
              className={cn(
                "p-4 rounded-lg border",
                difference === 0
                  ? "bg-green-50 border-green-200"
                  : "bg-red-50 border-red-200",
              )}
            >
              <p
                className={cn(
                  "text-sm",
                  difference === 0
                    ? "text-green-700"
                    : "text-red-700",
                )}
              >
                Difference
              </p>

              <p
                className={cn(
                  "text-xl font-bold",
                  difference === 0
                    ? "text-green-700"
                    : "text-red-700",
                )}
              >
                ₹
                {difference.toLocaleString("en-IN")}
              </p>
            </div>
          </div>

          <div className="border rounded-md overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px] text-center">
                    Match
                  </TableHead>

                  <TableHead>Date</TableHead>

                  <TableHead>
                    Description
                  </TableHead>

                  <TableHead className="text-right">
                    Credit (₹)
                  </TableHead>

                  <TableHead className="text-right">
                    Debit (₹)
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {loadingEntries ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center h-32"
                    >
                      <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ) : entries.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center h-32 text-muted-foreground"
                    >
                      No unreconciled entries found
                      for this period.
                    </TableCell>
                  </TableRow>
                ) : (
                  entries.map((entry) => {
                    const isDebit = [
                      "EXPENSE",
                      "TRANSFER_OUT",
                    ].includes(entry.type);

                    return (
                      <TableRow
                        key={entry.id}
                        className={
                          matchedIds.has(entry.id)
                            ? "bg-muted/50"
                            : ""
                        }
                      >
                        <TableCell className="text-center">
                          <Checkbox
                            checked={matchedIds.has(
                              entry.id,
                            )}
                            onCheckedChange={() =>
                              toggleMatch(entry.id)
                            }
                          />
                        </TableCell>

                        <TableCell>
                          {format(
                            new Date(entry.date),
                            "dd MMM yyyy",
                          )}
                        </TableCell>

                        <TableCell>
                          {entry.description}
                        </TableCell>

                        <TableCell className="text-right font-medium text-green-600">
                          {!isDebit
                            ? entry.amount.toLocaleString(
                                "en-IN",
                              )
                            : ""}
                        </TableCell>

                        <TableCell className="text-right font-medium text-red-600">
                          {isDebit
                            ? entry.amount.toLocaleString(
                                "en-IN",
                              )
                            : ""}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>

        <CardFooter className="justify-between">
          <Button
            variant="outline"
            onClick={() => setStep(1)}
            disabled={isSubmitting}
          >
            Back to Setup
          </Button>

          <Button
            onClick={finishReconciliation}
            disabled={isSubmitting}
            className="gap-2"
          >
            {isSubmitting && (
              <Loader2 className="h-4 w-4 animate-spin" />
            )}

            {difference === 0 ? (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Complete Reconciliation
              </>
            ) : (
              "Save as Draft (Unbalanced)"
            )}
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // STEP 1
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Reconciliation Setup
        </CardTitle>

        <CardDescription>
          Enter the details from your physical or
          digital bank statement.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Form {...form}>
          <form
            id="setup-form"
            onSubmit={form.handleSubmit(
              onSetupComplete,
            )}
            className="grid md:grid-cols-2 gap-6"
          >
            {/* Account */}
            <FormField
              control={form.control}
              name="accountId"
              render={({ field }) => (
                <FormItem className="space-y-2 col-span-2 md:col-span-1">
                  <FormLabel>
                    Bank Account *
                  </FormLabel>

                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select account" />
                      </SelectTrigger>
                    </FormControl>

                    <SelectContent>
                      {accounts.map((a) => (
                        <SelectItem
                          key={a.id}
                          value={a.id}
                        >
                          {a.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="hidden md:block" />

            {/* From Date */}
            <FormField
              control={form.control}
              name="statementFromDate"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel>
                    Statement Start Date *
                  </FormLabel>

                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !fromDate &&
                              "text-muted-foreground",
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />

                          {fromDate ? (
                            format(fromDate, "PPP")
                          ) : (
                            <span>
                              Pick a date
                            </span>
                          )}
                        </Button>
                      </FormControl>
                    </PopoverTrigger>

                    <PopoverContent
                      className="w-auto p-0"
                      align="start"
                    >
                      <Calendar
                        mode="single"
                        selected={fromDate}
                        onSelect={(d) =>
                          d && field.onChange(d)
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>

                  <FormMessage />
                </FormItem>
              )}
            />

            {/* To Date */}
            <FormField
              control={form.control}
              name="statementToDate"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel>
                    Statement End Date *
                  </FormLabel>

                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !toDate &&
                              "text-muted-foreground",
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />

                          {toDate ? (
                            format(toDate, "PPP")
                          ) : (
                            <span>
                              Pick a date
                            </span>
                          )}
                        </Button>
                      </FormControl>
                    </PopoverTrigger>

                    <PopoverContent
                      className="w-auto p-0"
                      align="start"
                    >
                      <Calendar
                        mode="single"
                        selected={toDate}
                        onSelect={(d) =>
                          d && field.onChange(d)
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>

                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Opening Balance */}
            <FormField
              control={form.control}
              name="openingBalanceBank"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel>
                    Opening Balance on Statement
                    (₹) *
                  </FormLabel>

                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      value={field.value ?? ""}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value === ""
                            ? 0
                            : e.target.valueAsNumber,
                        )
                      }
                    />
                  </FormControl>

                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Closing Balance */}
            <FormField
              control={form.control}
              name="closingBalanceBank"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel>
                    Closing Balance on Statement
                    (₹) *
                  </FormLabel>

                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      value={field.value ?? ""}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value === ""
                            ? 0
                            : e.target.valueAsNumber,
                        )
                      }
                    />
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
                <FormItem className="space-y-2 col-span-2">
                  <FormLabel>
                    Notes (Optional)
                  </FormLabel>

                  <FormControl>
                    <Input
                      {...field}
                      placeholder="e.g. Month End statement"
                    />
                  </FormControl>

                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
      </CardContent>

      <CardFooter className="justify-end">
        <Button
          form="setup-form"
          type="submit"
          className="gap-2"
        >
          Next: Match Entries{" "}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}
