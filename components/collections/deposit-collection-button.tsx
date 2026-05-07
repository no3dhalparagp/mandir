"use client";

import React, { useState } from "react";
import {
  Loader2,
  Banknote,
  FileText,
  AlertCircle,
  Send,
  TrendingUp,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Input } from "@/components/ui/input";

import { Label } from "@/components/ui/label";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

import { markCollectionDeposited } from "@/app/dashboard/collections/actions";

interface Props {
  collectionId: string;
  accounts: {
    id: string;
    name: string;
  }[];
  recollectMode?: boolean;
  recollectAmount?: number;
}

export function DepositCollectionButton({
  collectionId,
  accounts,
  recollectMode = false,
  recollectAmount,
}: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [accountId, setAccountId] = useState<string>("");
  const [depositSlipNo, setDepositSlipNo] = useState<string>("");

  const filteredAccounts = React.useMemo(() => {
    if (recollectMode) {
      return accounts;
    }
    return accounts;
  }, [accounts, recollectMode]);

  async function handleSubmit() {
    if (!accountId) {
      toast.error("Please select an account");
      return;
    }

    try {
      setLoading(true);

      const result = await markCollectionDeposited(
        collectionId,
        accountId,
        depositSlipNo,
        recollectMode,
      );

      if (result?.success) {
        toast.success(
          recollectMode
            ? "Recollection submitted successfully!"
            : "Collection deposited successfully!",
        );
        setOpen(false);
        setAccountId("");
        setDepositSlipNo("");
        window.location.reload();
      } else {
        toast.error(result?.error ?? "Something went wrong");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to submit");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <Button
          size="sm"
          variant={recollectMode ? "destructive" : "default"}
          className={
            recollectMode
              ? ""
              : "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
          }
        >
          {recollectMode ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2" />
              Recollect
            </>
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              Deposit
            </>
          )}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader className="pb-2">
          <div className="flex items-center gap-3 mb-2">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center ${recollectMode ? "bg-gradient-to-br from-red-500 to-rose-600" : "bg-gradient-to-br from-emerald-500 to-teal-600"}`}
            >
              {recollectMode ? (
                <RefreshCw className="w-6 h-6 text-white" />
              ) : (
                <Send className="w-6 h-6 text-white" />
              )}
            </div>
            <div>
              <DialogTitle className="text-xl">
                {recollectMode ? "Recollect Collection" : "Deposit Collection"}
              </DialogTitle>
              <DialogDescription>
                {recollectMode
                  ? "Submit the remaining amount for collection"
                  : "Send collection to accountant"}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {recollectMode && (
            <Card className="border-2 border-red-200 bg-red-50/50">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <CardTitle className="text-sm font-medium text-red-700">
                    Remaining Amount to Recollect
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-700">
                  ₹
                  {(recollectAmount ?? 0).toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {!recollectMode && (
            <Card className="border-2 border-emerald-200 bg-emerald-50/50">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                  <CardTitle className="text-sm font-medium text-emerald-700">
                    Deposit to Account
                  </CardTitle>
                </div>
              </CardHeader>
            </Card>
          )}

          <Separator />

          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Banknote className="w-4 h-4 text-muted-foreground" />
                Select Account
              </Label>
              <Select
                value={accountId}
                onValueChange={(value) => setAccountId(value ?? "")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose an account" />
                </SelectTrigger>
                <SelectContent>
                  {filteredAccounts.length === 0 ? (
                    <SelectItem value="NO_ACCOUNT" disabled>
                      No account found
                    </SelectItem>
                  ) : (
                    filteredAccounts.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-muted-foreground" />
                Deposit Slip No
                <span className="text-xs text-muted-foreground font-normal">
                  (Optional)
                </span>
              </Label>
              <Input
                placeholder="Enter deposit slip number..."
                value={depositSlipNo}
                onChange={(e) => setDepositSlipNo(e.target.value)}
              />
            </div>
          </div>
        </div>

        <DialogFooter className="pt-4 gap-3">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            className={`min-w-[160px] ${recollectMode ? "" : "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"}`}
            disabled={loading || !accountId}
            onClick={handleSubmit}
            variant={recollectMode ? "destructive" : "default"}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                {recollectMode ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Submit Recollection
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Submit Deposit
                  </>
                )}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
