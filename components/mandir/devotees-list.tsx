"use client"

import useSWR from "swr"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, Loader2 } from "lucide-react"
import Link from "next/link"
import { formatDate } from "@/lib/utils"

export function DevoteesListComponent() {
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("")

  const { data, isLoading, error } = useSWR(
    `/api/devotees?${search ? `search=${search}` : ""}${status ? `&status=${status}` : ""}`
  )

  const devotees = data?.data || []

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search devotees..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="px-3 py-2 border rounded-md text-sm"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
          <option value="SUSPENDED">Suspended</option>
          <option value="LIFETIME">Lifetime</option>
        </select>
        <Button asChild>
          <Link href="/dashboard/devotees/new">
            <Plus className="h-4 w-4 mr-2" />
            New Devotee
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : error ? (
        <div className="text-red-500">Failed to load devotees</div>
      ) : devotees.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No devotees found
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Mobile</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Total Donations</TableHead>
                <TableHead>Pujas</TableHead>
                <TableHead>Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {devotees.map((devotee: any) => (
                <TableRow key={devotee.id}>
                  <TableCell className="font-medium">{devotee.name}</TableCell>
                  <TableCell>{devotee.email || "-"}</TableCell>
                  <TableCell>{devotee.mobile || "-"}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        devotee.status === "ACTIVE"
                          ? "default"
                          : devotee.status === "LIFETIME"
                          ? "secondary"
                          : "outline"
                      }
                    >
                      {devotee.status}
                    </Badge>
                  </TableCell>
                  <TableCell>₹{devotee.totalDonations || 0}</TableCell>
                  <TableCell>{devotee.totalPujas || 0}</TableCell>
                  <TableCell>{formatDate(devotee.joiningDate)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
