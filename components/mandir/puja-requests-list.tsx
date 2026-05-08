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
import { formatDate } from "@/lib/utils"

export function PujaRequestsListComponent() {
  const [status, setStatus] = useState("")
  const [pujaType, setPujaType] = useState("")

  const { data, isLoading, error } = useSWR(
    `/api/puja-requests?${status ? `status=${status}` : ""}${pujaType ? `&pujaType=${pujaType}` : ""}`
  )

  const requests = data?.data || []

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "default"
      case "CONFIRMED":
        return "secondary"
      case "COMPLETED":
        return "outline"
      case "CANCELLED":
        return "destructive"
      default:
        return "outline"
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <select
          className="px-3 py-2 border rounded-md text-sm"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">All Status</option>
          <option value="PENDING">Pending</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
        <select
          className="px-3 py-2 border rounded-md text-sm"
          value={pujaType}
          onChange={(e) => setPujaType(e.target.value)}
        >
          <option value="">All Puja Types</option>
          <option value="DAILY">Daily</option>
          <option value="WEEKLY">Weekly</option>
          <option value="FESTIVAL">Festival</option>
          <option value="CUSTOM">Custom</option>
          <option value="MARRIAGE">Marriage</option>
          <option value="DEATH_RITUAL">Death Ritual</option>
          <option value="YAGNA">Yagna</option>
        </select>
        <Button asChild className="ml-auto">
          <Link href="/dashboard/puja-requests/new">
            <Plus className="h-4 w-4 mr-2" />
            New Request
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : error ? (
        <div className="text-red-500">Failed to load puja requests</div>
      ) : requests.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No puja requests found
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Request No</TableHead>
                <TableHead>Devotee</TableHead>
                <TableHead>Puja Type</TableHead>
                <TableHead>Deity</TableHead>
                <TableHead>Requested Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Cost</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((request: any) => (
                <TableRow key={request.id}>
                  <TableCell className="font-medium">{request.requestNo}</TableCell>
                  <TableCell>{request.devotee?.name}</TableCell>
                  <TableCell>{request.pujaType}</TableCell>
                  <TableCell>{request.deityName || "-"}</TableCell>
                  <TableCell>{formatDate(request.requestedDate)}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusColor(request.status)}>
                      {request.status}
                    </Badge>
                  </TableCell>
                  <TableCell>₹{request.actualCost || request.estimatedCost || 0}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
