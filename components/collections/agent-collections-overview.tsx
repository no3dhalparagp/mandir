"use client";

import React, { useState, useTransition, useMemo } from "react";
import { format } from "date-fns";
import {
  Eye,
  Send,
  Users,
  ArrowRight,
  CheckCircle2,
  Circle,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { bulkSendToAccountant } from "@/app/dashboard/collections/actions";

type Collection = {
  id: string;
  collectedAmount: number;
  collectedDate: Date;
  donation: {
    id: string;
    donorName: string;
    receiptNo: string;
  };
};

type CollectorData = {
  member: { id: string; name: string; memberId: string };
  collections: Collection[];
  totalAmount: number;
};

type CollectionsBankAccount = {
  id: string;
  name: string;
  accountType: string;
};

interface AgentCollectionsOverviewProps {
  collectorData: CollectorData[];
  accounts: CollectionsBankAccount[];
}

export function AgentCollectionsOverview({
  collectorData,
  accounts,
}: AgentCollectionsOverviewProps) {
  const [openDialogs, setOpenDialogs] = useState<Record<string, boolean>>({});
  const [selectedCollections, setSelectedCollections] = useState<
    Record<string, boolean>
  >({});
  const [selectedAccountIds, setSelectedAccountIds] = useState<
    Record<string, string>
  >({});
  const [isPending, startTransition] = useTransition();

  const cashAccounts = accounts.filter((a) => a.accountType === "CASH_IN_HAND");

  const getSelectedIds = (collectorId: string, collections: Collection[]) => {
    return collections
      .filter((c) => selectedCollections[`${collectorId}-${c.id}`])
      .map((c) => c.id);
  };

  const toggleCollection = (
    collectorId: string,
    collectionId: string,
    checked: boolean,
  ) => {
    setSelectedCollections((prev) => ({
      ...prev,
      [`${collectorId}-${collectionId}`]: checked,
    }));
  };

  const toggleAll = (
    collectorId: string,
    collections: Collection[],
    checked: boolean,
  ) => {
    if (!checked) {
      setSelectedCollections((prev) => {
        const next = { ...prev };
        for (const c of collections) {
          delete next[`${collectorId}-${c.id}`];
        }
        return next;
      });
      return;
    }

    setSelectedCollections((prev) => {
      const next = { ...prev };
      for (const c of collections) {
        next[`${collectorId}-${c.id}`] = true;
      }
      return next;
    });
  };

  const handleSendToAccountant = (collector: CollectorData) => {
    const accountId =
      selectedAccountIds[collector.member.id] || cashAccounts[0]?.id;
    if (!accountId) {
      toast.error("Please select a cash account");
      return;
    }

    const collectionIds = getSelectedIds(
      collector.member.id,
      collector.collections,
    );
    if (collectionIds.length === 0) {
      toast.error("Please select at least one collection");
      return;
    }

    startTransition(async () => {
      const result = await bulkSendToAccountant(collectionIds, accountId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(
          `Successfully sent ${collectionIds.length} collection${collectionIds.length > 1 ? "s" : ""} to accountant!`,
        );
        setSelectedCollections((prev) => {
          const next = { ...prev };
          for (const c of collector.collections) {
            delete next[`${collector.member.id}-${c.id}`];
          }
          return next;
        });
        setOpenDialogs((prev) => ({ ...prev, [collector.member.id]: false }));
        window.location.reload();
      }
    });
  };

  if (collectorData.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <Users className="w-8 h-8 text-muted-foreground" />
          </div>
          <CardTitle className="text-lg mb-2">No Pending Collections</CardTitle>
          <CardDescription>
            All collections from agents have been processed
          </CardDescription>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle>Pending Collections by Agents</CardTitle>
              <CardDescription>
                Review and process collections submitted by members
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {collectorData.map((collector) => {
              const selectedCount = getSelectedIds(
                collector.member.id,
                collector.collections,
              ).length;
              return (
                <Card
                  key={collector.member.id}
                  className="overflow-hidden transition-all duration-200 hover:shadow-md border-l-4 border-l-amber-500"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12 border-2 border-amber-100">
                          <AvatarImage src="" />
                          <AvatarFallback className="bg-gradient-to-br from-amber-400 to-orange-500 text-white font-bold">
                            {collector.member.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-base">
                            {collector.member.name}
                          </CardTitle>
                          <CardDescription className="text-xs">
                            {collector.member.memberId}
                          </CardDescription>
                        </div>
                      </div>
                      <Badge
                        variant="secondary"
                        className="bg-amber-100 text-amber-800 hover:bg-amber-100"
                      >
                        {collector.collections.length}{" "}
                        {collector.collections.length === 1 ? "item" : "items"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-4">
                    <div className="mb-4">
                      <div className="flex items-baseline justify-between mb-1">
                        <span className="text-sm text-muted-foreground">
                          Total Amount
                        </span>
                        <TrendingUp className="w-4 h-4 text-amber-600" />
                      </div>
                      <div className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                        ₹
                        {collector.totalAmount.toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                        })}
                      </div>
                    </div>

                    <Separator className="mb-4" />

                    <Dialog
                      open={openDialogs[collector.member.id]}
                      onOpenChange={(open) =>
                        setOpenDialogs((prev) => ({
                          ...prev,
                          [collector.member.id]: open,
                        }))
                      }
                    >
                      <DialogTrigger
                        render={
                          <Button className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white">
                            <Eye className="w-4 h-4 mr-2" />
                            View & Process
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </Button>
                        }
                      />
                      <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col p-0">
                        <DialogHeader className="p-6 pb-2">
                          <div className="flex items-center gap-4">
                            <Avatar className="h-14 w-14 border-2 border-amber-100">
                              <AvatarFallback className="bg-gradient-to-br from-amber-400 to-orange-500 text-white text-xl font-bold">
                                {collector.member.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <DialogTitle className="text-xl">
                                {collector.member.name}
                              </DialogTitle>
                              <DialogDescription className="text-sm">
                                {collector.member.memberId} •{" "}
                                {collector.collections.length} pending
                                collections
                              </DialogDescription>
                            </div>
                          </div>
                        </DialogHeader>

                        <div className="px-6 py-4 bg-muted/30 border-y">
                          <div className="flex items-center justify-between flex-wrap gap-4">
                            <div>
                              <p className="text-sm text-muted-foreground">
                                Total Amount
                              </p>
                              <p className="text-2xl font-bold text-amber-600">
                                ₹
                                {collector.totalAmount.toLocaleString("en-IN", {
                                  minimumFractionDigits: 2,
                                })}
                              </p>
                            </div>
                            <div className="flex items-center gap-3">
                              <Select
                                value={
                                  selectedAccountIds[collector.member.id] ||
                                  cashAccounts[0]?.id ||
                                  ""
                                }
                                onValueChange={(val) =>
                                  setSelectedAccountIds((prev) => ({
                                    ...prev,
                                    [collector.member.id]: val ?? "",
                                  }))
                                }
                              >
                                <SelectTrigger className="w-[220px]">
                                  <SelectValue placeholder="Select cash account" />
                                </SelectTrigger>
                                <SelectContent>
                                  {cashAccounts.map((account) => (
                                    <SelectItem
                                      key={account.id}
                                      value={account.id}
                                    >
                                      {account.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>

                        <ScrollArea className="flex-1 px-6">
                          <div className="py-4">
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-2">
                                <Badge
                                  variant="outline"
                                  className="font-normal"
                                >
                                  {selectedCount} of{" "}
                                  {collector.collections.length} selected
                                </Badge>
                              </div>
                            </div>

                            <div className="rounded-lg border overflow-hidden">
                              <Table>
                                <TableHeader className="bg-muted/50">
                                  <TableRow>
                                    <TableHead className="w-[50px]">
                                      <Checkbox
                                        checked={
                                          collector.collections.length > 0 &&
                                          collector.collections.every(
                                            (c) =>
                                              selectedCollections[
                                                `${collector.member.id}-${c.id}`
                                              ],
                                          )
                                        }
                                        onCheckedChange={(val) =>
                                          toggleAll(
                                            collector.member.id,
                                            collector.collections,
                                            val === true,
                                          )
                                        }
                                      />
                                    </TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Receipt</TableHead>
                                    <TableHead>Donor</TableHead>
                                    <TableHead className="text-right">
                                      Amount
                                    </TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {collector.collections.map((collection) => (
                                    <TableRow
                                      key={collection.id}
                                      className={
                                        selectedCollections[
                                          `${collector.member.id}-${collection.id}`
                                        ]
                                          ? "bg-amber-50"
                                          : ""
                                      }
                                    >
                                      <TableCell>
                                        <Checkbox
                                          checked={
                                            !!selectedCollections[
                                              `${collector.member.id}-${collection.id}`
                                            ]
                                          }
                                          onCheckedChange={(val) =>
                                            toggleCollection(
                                              collector.member.id,
                                              collection.id,
                                              val === true,
                                            )
                                          }
                                        />
                                      </TableCell>
                                      <TableCell className="text-sm">
                                        {format(
                                          new Date(collection.collectedDate),
                                          "dd MMM yy",
                                        )}
                                      </TableCell>
                                      <TableCell className="font-mono text-xs text-muted-foreground">
                                        {collection.donation.receiptNo}
                                      </TableCell>
                                      <TableCell className="font-medium">
                                        {collection.donation.donorName}
                                      </TableCell>
                                      <TableCell className="text-right font-bold text-amber-700">
                                        ₹
                                        {collection.collectedAmount.toLocaleString(
                                          "en-IN",
                                          { minimumFractionDigits: 2 },
                                        )}
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          </div>
                        </ScrollArea>

                        <DialogFooter className="p-6 pt-2 gap-3 border-t bg-muted/20">
                          <Button
                            variant="outline"
                            onClick={() =>
                              setOpenDialogs((prev) => ({
                                ...prev,
                                [collector.member.id]: false,
                              }))
                            }
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={() => handleSendToAccountant(collector)}
                            disabled={
                              isPending ||
                              selectedCount === 0 ||
                              !selectedAccountIds[collector.member.id]
                            }
                            className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white min-w-[180px]"
                          >
                            <Send className="w-4 h-4 mr-2" />
                            {isPending ? (
                              <>Processing...</>
                            ) : (
                              <>
                                Send {selectedCount} to Accountant
                                <CheckCircle2 className="w-4 h-4 ml-2" />
                              </>
                            )}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
