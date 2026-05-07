"use client";

import React, { useState } from "react";
import {
  CheckCircle2,
  AlertCircle,
  Loader2,
  IndianRupee,
  FileText,
} from "lucide-react";
import { toast } from "sonner";

import { verifyCollection } from "@/app/dashboard/collections/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Separator } from "@/components/ui/separator";

export function VerifyCollectionButton({
  collectionId,
  collectedAmount,
}: {
  collectionId: string;
  collectedAmount: number;
}) {
  const [open, setOpen] = useState(false);
  const [verifiedAmount, setVerifiedAmount] = useState(collectedAmount);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  const hasDiscrepancy = verifiedAmount !== collectedAmount;
  const discrepancy = collectedAmount - verifiedAmount;

  const handleVerify = async () => {
    if (verifiedAmount <= 0) {
      toast.error("Verified amount must be greater than 0");
      return;
    }

    setLoading(true);
    try {
      const res = await verifyCollection(collectionId, verifiedAmount, note);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("Collection verified successfully!");
        setOpen(false);
        setVerifiedAmount(collectedAmount);
        setNote("");
        window.location.reload();
      }
    } catch (error) {
      toast.error("Failed to verify collection");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger >
        <Button
          size="sm"
          variant="default"
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
        >
          <CheckCircle2 className="w-4 h-4 mr-2" />
          Verify
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="pb-2">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <DialogTitle className="text-xl">Verify Collection</DialogTitle>
              <DialogDescription>Confirm the amount received</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          <Card className="border-2 border-blue-100 bg-blue-50/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <IndianRupee className="w-4 h-4 text-blue-600" />
                Amount Collected
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-700">
                ₹
                {collectedAmount.toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                })}
              </div>
            </CardContent>
          </Card>

          <Separator />

          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <IndianRupee className="w-4 h-4 text-muted-foreground" />
                Verified Amount
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                  ₹
                </span>
                <Input
                  type="number"
                  step="0.01"
                  className="pl-8 text-lg font-medium"
                  value={verifiedAmount}
                  onChange={(e) =>
                    setVerifiedAmount(parseFloat(e.target.value) || 0)
                  }
                />
              </div>
            </div>

            {hasDiscrepancy && (
              <div
                className={`rounded-lg border p-4 ${discrepancy > 0 ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50"}`}
              >
                <div className="flex items-start gap-3">
                  <AlertCircle
                    className={`w-5 h-5 mt-0.5 ${discrepancy > 0 ? "text-red-600" : "text-green-600"}`}
                  />
                  <div>
                    <Badge
                      variant="outline"
                      className={
                        discrepancy > 0
                          ? "bg-red-100 text-red-700 border-red-200"
                          : "bg-green-100 text-green-700 border-green-200"
                      }
                    >
                      {discrepancy > 0 ? "Shortage" : "Extra"}
                    </Badge>
                    <p
                      className={`text-sm mt-2 font-medium ${discrepancy > 0 ? "text-red-700" : "text-green-700"}`}
                    >
                      ₹
                      {Math.abs(discrepancy).toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                      })}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {hasDiscrepancy && (
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  Note (Discrepancy Reason)
                </Label>
                <Input
                  placeholder="Explain the reason for discrepancy..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>
            )}
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
            onClick={handleVerify}
            disabled={loading || verifiedAmount <= 0}
            className={`min-w-[140px] ${hasDiscrepancy ? "bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700" : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"} text-white`}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Verifying...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Confirm Verification
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
