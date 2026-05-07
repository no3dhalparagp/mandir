"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Calendar, Clock, CheckCircle, AlertCircle, Plus } from "lucide-react";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const monthCloseSchema = z.object({
  year: z.string().min(4),
  month: z.string().min(1).max(2),
  notes: z.string().optional(),
});

type MonthCloseForm = z.infer<typeof monthCloseSchema>;

export default function MonthClosePage() {
  const [closures, setClosures] = useState<any[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const form = useForm<MonthCloseForm>({
    resolver: zodResolver(monthCloseSchema),
    defaultValues: {
      year: new Date().getFullYear().toString(),
      month: (new Date().getMonth() + 1).toString().padStart(2, "0"),
      notes: "",
    },
  });

  useEffect(() => {
    loadClosures();
  }, []);

  async function loadClosures() {
    try {
      const res = await fetch("/api/book-closures?type=MONTH");
      if (res.ok) {
        const data = await res.json();
        setClosures(data);
      }
    } catch (error) {
      console.error("Failed to load closures:", error);
    } finally {
      setLoading(false);
    }
  }

  async function onSubmit(data: MonthCloseForm) {
    try {
      const res = await fetch("/api/book-closures", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          closureType: "MONTH",
          year: parseInt(data.year),
          month: parseInt(data.month),
          notes: data.notes,
        }),
      });

      if (res.ok) {
        toast.success("Month closed successfully!");
        setIsDialogOpen(false);
        form.reset();
        loadClosures();
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to close month");
      }
    } catch (error) {
      toast.error("Failed to close month");
    }
  }

  const months = [
    { value: "01", label: "January" },
    { value: "02", label: "February" },
    { value: "03", label: "March" },
    { value: "04", label: "April" },
    { value: "05", label: "May" },
    { value: "06", label: "June" },
    { value: "07", label: "July" },
    { value: "08", label: "August" },
    { value: "09", label: "September" },
    { value: "10", label: "October" },
    { value: "11", label: "November" },
    { value: "12", label: "December" },
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Month Close</h1>
          <p className="text-muted-foreground">
            Close monthly books to lock transactions.
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger
            render={
              <Button className="gap-2">
                <Plus className="h-4 w-4" /> Close Month
              </Button>
            }
          />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Close Month</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="year"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Year</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select year" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {years.map((year) => (
                              <SelectItem key={year} value={year.toString()}>
                                {year}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="month"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Month</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select month" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {months.map((month) => (
                              <SelectItem key={month.value} value={month.value}>
                                {month.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Optional notes about this month close"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">Close Month</Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>About Month Close</CardTitle>
          <CardDescription>
            Closing a month locks all transactions for that period, ensuring
            data integrity. Once closed, you can still view reports but cannot
            modify transactions.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>• All transactions for the closed month become read-only</p>
          <p>• Reports can still be generated for closed periods</p>
          <p>
            • Closing is irreversible - please review carefully before closing
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Closed Months</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Period</TableHead>
                <TableHead>Label</TableHead>
                <TableHead>Closed At</TableHead>
                <TableHead>Closed By</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="h-24 text-center text-muted-foreground"
                  >
                    Loading...
                  </TableCell>
                </TableRow>
              ) : closures.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="h-24 text-center text-muted-foreground"
                  >
                    No months closed yet.
                  </TableCell>
                </TableRow>
              ) : (
                closures.map((closure) => (
                  <TableRow key={closure.id}>
                    <TableCell className="font-medium">
                      {format(new Date(closure.periodStart), "MMMM yyyy")}
                    </TableCell>
                    <TableCell>{closure.label}</TableCell>
                    <TableCell className="text-sm">
                      {format(new Date(closure.closedAt), "dd MMM yyyy, HH:mm")}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {closure.closedBy?.name ?? "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {closure.notes ?? "—"}
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
                        <CheckCircle className="h-3 w-3 mr-1" /> Closed
                      </Badge>
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
