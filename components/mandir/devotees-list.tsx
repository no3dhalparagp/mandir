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
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Plus, Search, Loader2, AlertCircle, Eye } from "lucide-react"
import Link from "next/link"
import { formatDate, formatINR } from "@/lib/utils"

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
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load devotees. Please try again later.
          </AlertDescription>
        </Alert>
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
                <TableHead>Contact</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Donations</TableHead>
                <TableHead className="text-right">Pujas</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {devotees.map((devotee: any) => (
                <TableRow key={devotee.id} className="hover:bg-muted/50 cursor-pointer">
                  <TableCell className="font-medium">{devotee.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    <div>{devotee.email || "-"}</div>
                    <div>{devotee.mobile || "-"}</div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        devotee.status === "ACTIVE"
                          ? "default"
                          : devotee.status === "LIFETIME"
                          ? "secondary"
                          : devotee.status === "SUSPENDED"
                          ? "destructive"
                          : "outline"
                      }
                      className="whitespace-nowrap"
                    >
                      {devotee.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {formatINR(devotee.totalDonations || 0)}
                  </TableCell>
                  <TableCell className="text-right">{devotee.totalPujas || 0}</TableCell>
                  <TableCell className="text-sm">{formatDate(devotee.joiningDate)}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      asChild
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Link href={`/dashboard/devotees/${devotee.id}`}>
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Link>
                    </Button>
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
