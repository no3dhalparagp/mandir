"use client"

import useSWR from "swr"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Plus, Loader2 } from "lucide-react"
import Link from "next/link"
import { formatDate, formatINR } from "@/lib/utils"

export function MandiDonationsListComponent() {
  const [purpose, setPurpose] = useState("")
  const [type, setType] = useState("")

  const { data, isLoading, error } = useSWR(
    `/api/mandir-donations?${purpose ? `purpose=${purpose}` : ""}${type ? `&type=${type}` : ""}`
  )

  const donations = data?.data || []

  const purposeOptions = [
    { value: "GENERAL", label: "General Fund" },
    { value: "MAINTENANCE", label: "Maintenance" },
    { value: "DEITY", label: "Deity" },
    { value: "PUJA", label: "Puja" },
    { value: "PRASAD", label: "Prasad" },
    { value: "CHARITY", label: "Charity" },
    { value: "EDUCATION", label: "Education" },
    { value: "MEDICAL", label: "Medical" },
    { value: "SPECIAL_CAUSE", label: "Special Cause" },
  ]

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <select
          className="px-3 py-2 border rounded-md text-sm"
          value={purpose}
          onChange={(e) => setPurpose(e.target.value)}
        >
          <option value="">All Purposes</option>
          {purposeOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <select
          className="px-3 py-2 border rounded-md text-sm"
          value={type}
          onChange={(e) => setType(e.target.value)}
        >
          <option value="">All Types</option>
          <option value="CASH">Cash</option>
          <option value="CHECK">Check</option>
          <option value="BANK_TRANSFER">Bank Transfer</option>
          <option value="ONLINE">Online</option>
          <option value="KIND">In Kind</option>
        </select>
        <Button asChild className="ml-auto">
          <Link href="/dashboard/mandir-donations/new">
            <Plus className="h-4 w-4 mr-2" />
            Record Donation
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : error ? (
        <div className="text-red-500">Failed to load donations</div>
      ) : donations.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No donations found
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Donation No</TableHead>
                <TableHead>Devotee</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Purpose</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Receipt</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {donations.map((donation: any) => (
                <TableRow key={donation.id}>
                  <TableCell className="font-medium">{donation.donationNo}</TableCell>
                  <TableCell>{donation.devotee?.name || donation.donorName || "-"}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{donation.donationType}</Badge>
                  </TableCell>
                  <TableCell>{donation.purpose}</TableCell>
                  <TableCell>{formatINR(donation.amount)}</TableCell>
                  <TableCell>{formatDate(donation.donationDate)}</TableCell>
                  <TableCell>
                    <Badge variant={donation.acknowledgmentSent ? "default" : "outline"}>
                      {donation.acknowledgmentSent ? "Sent" : "Pending"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
