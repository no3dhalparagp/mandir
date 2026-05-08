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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2, ArrowLeft, AlertCircle, Flame, Users } from "lucide-react"
import { formatDate, formatINR } from "@/lib/utils"

interface PujaRequest {
  id: string
  requestNo: string
  devotee: {
    name: string
  }
  pujaType: string
  deityName?: string
  requestDate: string
  requestedDate: string
  completedDate?: string
  description?: string
  numberOfPeople: number
  estimatedCost?: number
  actualCost?: number
  status: string
  priestAssigned?: string
  specialRequests?: string
  notes?: string
}

export default function PujaRequestDetailPage() {
  const params = useParams()
  const pujaId = params.id as string
  
  const [puja, setPuja] = useState<PujaRequest | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updating, setUpdating] = useState(false)
  const [newStatus, setNewStatus] = useState("")

  useEffect(() => {
    const fetchPuja = async () => {
      try {
        const response = await fetch(`/api/puja-requests/${pujaId}`)
        if (!response.ok) throw new Error("Failed to load puja request")
        const data = await response.json()
        setPuja(data.data)
        setNewStatus(data.data.status)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load puja details")
      } finally {
        setLoading(false)
      }
    }

    fetchPuja()
  }, [pujaId])

  const handleStatusUpdate = async () => {
    if (!puja || newStatus === puja.status) return
    setUpdating(true)
    try {
      const response = await fetch(`/api/puja-requests/${pujaId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!response.ok) throw new Error("Failed to update status")
      setPuja({ ...puja, status: newStatus })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update status")
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !puja) {
    return (
      <div className="space-y-4">
        <Button variant="outline" asChild>
          <Link href="/dashboard/puja-requests">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Puja Requests
          </Link>
        </Button>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || "Puja request not found"}</AlertDescription>
        </Alert>
      </div>
    )
  }

  const statusColor =
    puja.status === "PENDING" ? "default" :
    puja.status === "CONFIRMED" ? "secondary" :
    puja.status === "COMPLETED" ? "outline" : "destructive"

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Flame className="h-8 w-8 text-orange-500" />
            {puja.requestNo}
          </h1>
          <p className="text-muted-foreground mt-1">{puja.pujaType.replace(/_/g, " ")}</p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/dashboard/puja-requests">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Link>
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        {/* Devotee Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Devotee
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">{puja.devotee.name}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Requested on {formatDate(puja.requestDate)}
            </p>
          </CardContent>
        </Card>

        {/* Cost Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Cost</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold">
              {formatINR(puja.actualCost || puja.estimatedCost || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {puja.actualCost ? "Actual Cost" : "Estimated"}
            </p>
          </CardContent>
        </Card>

        {/* Status Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={statusColor} className="mb-3">{puja.status}</Badge>
            <Select value={newStatus} onValueChange={setNewStatus}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            {newStatus !== puja.status && (
              <Button 
                size="sm" 
                className="w-full mt-2"
                onClick={handleStatusUpdate}
                disabled={updating}
              >
                {updating ? "Updating..." : "Update"}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Puja Details */}
      <Card>
        <CardHeader>
          <CardTitle>Puja Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm font-medium">Puja Type</p>
              <p className="text-sm text-muted-foreground">{puja.pujaType}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Deity</p>
              <p className="text-sm text-muted-foreground">{puja.deityName || "Not specified"}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Requested Date</p>
              <p className="text-sm text-muted-foreground">{formatDate(puja.requestedDate)}</p>
            </div>
            {puja.completedDate && (
              <div>
                <p className="text-sm font-medium">Completed Date</p>
                <p className="text-sm text-muted-foreground">{formatDate(puja.completedDate)}</p>
              </div>
            )}
            <div>
              <p className="text-sm font-medium">Number of People</p>
              <p className="text-sm text-muted-foreground">{puja.numberOfPeople}</p>
            </div>
            {puja.priestAssigned && (
              <div>
                <p className="text-sm font-medium">Priest Assigned</p>
                <p className="text-sm text-muted-foreground">{puja.priestAssigned}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Description */}
      {puja.description && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{puja.description}</p>
          </CardContent>
        </Card>
      )}

      {/* Special Requests */}
      {puja.specialRequests && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Special Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{puja.specialRequests}</p>
          </CardContent>
        </Card>
      )}

      {/* Notes */}
      {puja.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{puja.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
