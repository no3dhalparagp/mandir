"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, ArrowLeft, AlertCircle, Gift, PrinterIcon } from "lucide-react"
import { formatDate, formatINR } from "@/lib/utils"

interface MandiDonation {
  id: string
  donationNo: string
  receiptNo: string
  devotee?: {
    name: string
  }
  donorName?: string
  donationType: string
  purpose: string
  amount: number
  donationDate: string
  bankTransferId?: string
  chequeNumber?: string
  chequeDate?: string
  bankName?: string
  itemDescription?: string
  itemQuantity?: number
  itemUnit?: string
  acknowledgmentSent: boolean
  acknowledgmentDate?: string
  notes?: string
}

export default function DonationDetailPage() {
  const params = useParams()
  const donationId = params.id as string
  
  const [donation, setDonation] = useState<MandiDonation | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchDonation = async () => {
      try {
        const response = await fetch(`/api/mandir-donations/${donationId}`)
        if (!response.ok) throw new Error("Failed to load donation")
        const data = await response.json()
        setDonation(data.data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load donation details")
      } finally {
        setLoading(false)
      }
    }

    fetchDonation()
  }, [donationId])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !donation) {
    return (
      <div className="space-y-4">
        <Button variant="outline" asChild>
          <Link href="/dashboard/mandir-donations">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Donations
          </Link>
        </Button>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || "Donation not found"}</AlertDescription>
        </Alert>
      </div>
    )
  }

  const donorName = donation.devotee?.name || donation.donorName || "Anonymous"

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Gift className="h-8 w-8 text-green-600" />
            {donation.donationNo}
          </h1>
          <p className="text-muted-foreground mt-1">{donation.purpose}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.print()}>
            <PrinterIcon className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Button variant="outline" asChild>
            <Link href="/dashboard/mandir-donations">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Amount Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatINR(donation.amount)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              via {donation.donationType.replace(/_/g, " ")}
            </p>
          </CardContent>
        </Card>

        {/* Donor Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Donor</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">{donorName}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {formatDate(donation.donationDate)}
            </p>
          </CardContent>
        </Card>

        {/* Receipt Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Receipt</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">{donation.receiptNo}</p>
            <Badge
              variant={donation.acknowledgmentSent ? "default" : "secondary"}
              className="mt-2"
            >
              {donation.acknowledgmentSent ? "Acknowledged" : "Pending"}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Donation Details */}
      <Card>
        <CardHeader>
          <CardTitle>Donation Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm font-medium">Donation Type</p>
              <p className="text-sm text-muted-foreground">{donation.donationType}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Purpose</p>
              <p className="text-sm text-muted-foreground">{donation.purpose}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Date</p>
              <p className="text-sm text-muted-foreground">{formatDate(donation.donationDate)}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Amount</p>
              <p className="text-sm text-muted-foreground font-semibold">{formatINR(donation.amount)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Method Details */}
      {(donation.chequeNumber || donation.bankTransferId) && (
        <Card>
          <CardHeader>
            <CardTitle>Payment Method</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {donation.chequeNumber && (
              <>
                <div>
                  <p className="text-sm font-medium">Cheque Number</p>
                  <p className="text-sm text-muted-foreground">{donation.chequeNumber}</p>
                </div>
                {donation.chequeDate && (
                  <div>
                    <p className="text-sm font-medium">Cheque Date</p>
                    <p className="text-sm text-muted-foreground">{formatDate(donation.chequeDate)}</p>
                  </div>
                )}
                {donation.bankName && (
                  <div>
                    <p className="text-sm font-medium">Bank</p>
                    <p className="text-sm text-muted-foreground">{donation.bankName}</p>
                  </div>
                )}
              </>
            )}
            {donation.bankTransferId && (
              <div>
                <p className="text-sm font-medium">Transfer Reference</p>
                <p className="text-sm text-muted-foreground">{donation.bankTransferId}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* In-Kind Details */}
      {donation.itemDescription && (
        <Card>
          <CardHeader>
            <CardTitle>In-Kind Donation Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium">Item Description</p>
              <p className="text-sm text-muted-foreground">{donation.itemDescription}</p>
            </div>
            {donation.itemQuantity && (
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm font-medium">Quantity</p>
                  <p className="text-sm text-muted-foreground">{donation.itemQuantity}</p>
                </div>
                {donation.itemUnit && (
                  <div>
                    <p className="text-sm font-medium">Unit</p>
                    <p className="text-sm text-muted-foreground">{donation.itemUnit}</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Acknowledgment */}
      {donation.acknowledgmentSent && (
        <Card>
          <CardHeader>
            <CardTitle>Acknowledgment Status</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">
              <span className="font-medium">Acknowledged on: </span>
              <span className="text-muted-foreground">{formatDate(donation.acknowledgmentDate || donation.donationDate)}</span>
            </p>
          </CardContent>
        </Card>
      )}

      {/* Notes */}
      {donation.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{donation.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
