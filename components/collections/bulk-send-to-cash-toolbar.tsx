"use client";

import React, { useState, useTransition } from "react";
import { toast } from "sonner";
import { Send, Loader2, IndianRupee, CheckCircle2 } from "lucide-react";

import { bulkAddVerifiedCollectionsToCashAccount } from "@/app/dashboard/bank/actions";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

type CashAccount = {
  id: string;
  name: string;
  accountType: string;
};

type Props = {
  cashAccounts: CashAccount[];
  selectedIds: string[];
  onCompleted?: () => void;
};

export function BulkSendToCashToolbar({
  cashAccounts,
  selectedIds,
  onCompleted,
}: Props) {
  const [cashAccountId, setCashAccountId] = useState<string | undefined>(
    cashAccounts[0]?.id,
  );
  const [isPending, startTransition] = useTransition();

  const hasSelection = selectedIds.length > 0;
  const hasCashAccount = cashAccounts.length > 0;

  const handleSend = () => {
    if (!cashAccountId || !hasSelection) return;

    startTransition(async () => {
      const result = await bulkAddVerifiedCollectionsToCashAccount({
        cashAccountId,
        collectionIds: selectedIds,
      });

      if ("error" in result && result.error) {
        toast.error(result.error);
        return;
      }

      toast.success(
        `Successfully sent ${selectedIds.length} collection${selectedIds.length > 1 ? "s" : ""} to cash account!`,
      );
      onCompleted?.();
    });
  };

  if (!hasCashAccount) {
    return (
      <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-red-50 border border-red-200">
        <IndianRupee className="w-4 h-4 text-red-600" />
        <p className="text-sm text-red-700">
          No Cash in Hand account found. Please create one under Bank Accounts.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3 p-3 bg-muted/30 rounded-lg border">
      {hasSelection && (
        <Badge
          variant="secondary"
          className="bg-blue-100 text-blue-700 border-blue-200"
        >
          <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
          {selectedIds.length}{" "}
          {selectedIds.length === 1 ? "collection" : "collections"} selected
        </Badge>
      )}

      <div className="flex flex-1 flex-wrap items-center gap-2">
        <Select
          value={cashAccountId}
          onValueChange={(val) => setCashAccountId(val || undefined)}
        >
          <SelectTrigger className="w-[240px]">
            <div className="flex items-center gap-2">
              <IndianRupee className="w-4 h-4 text-muted-foreground" />
              <SelectValue placeholder="Select cash account" />
            </div>
          </SelectTrigger>
          <SelectContent>
            {cashAccounts.map((acc) => (
              <SelectItem key={acc.id} value={acc.id}>
                {acc.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          size="sm"
          onClick={handleSend}
          disabled={!hasSelection || !cashAccountId || isPending}
          className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white min-w-[180px]"
        >
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              Send {selectedIds.length} to Cash
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
