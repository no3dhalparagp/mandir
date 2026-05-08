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
import { Loader2, ArrowLeft, AlertCircle, Mail, Phone, MapPin } from "lucide-react"
import { formatDate, formatINR } from "@/lib/utils"

interface DevoteeDetail {
  id: string
  name: string
  email?: string
  mobile?: string
  address?: string
  status: string
  devotionType?: string
  joiningDate: string
  familyMembers: number
  dateOfBirth?: string
  anniversary?: string
  totalDonations: number
  totalPujas: number
  notes?: string
}

export default function DevoteeDetailPage() {
  const params = useParams()
  const devoteeId = params.id as string
  
  const [devotee, setDevotee] = useState<DevoteeDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchDevotee = async () => {
      try {
        const response = await fetch(`/api/devotees/${devoteeId}`)
        if (!response.ok) throw new Error("Failed to load devotee")
        const data = await response.json()
        setDevotee(data.data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load devotee details")
      } finally {
        setLoading(false)
      }
    }

    fetchDevotee()
  }, [devoteeId])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !devotee) {
    return (
      <div className="space-y-4">
        <Button variant="outline" asChild>
          <Link href="/dashboard/devotees">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Devotees
          </Link>
        </Button>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || "Devotee not found"}</AlertDescription>
        </Alert>
      </div>
    )
  }

  const statusColor = 
    devotee.status === "ACTIVE" ? "default" :
    devotee.status === "LIFETIME" ? "secondary" :
    devotee.status === "SUSPENDED" ? "destructive" : "outline"

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{devotee.name}</h1>
          <p className="text-muted-foreground mt-1">{devotee.devotionType || "Devotee"}</p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/dashboard/devotees">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Status Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-2">
              <Badge variant={statusColor}>{devotee.status}</Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Member since {formatDate(devotee.joiningDate)}
            </p>
          </CardContent>
        </Card>

        {/* Donations Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Donations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatINR(devotee.totalDonations)}</div>
            <p className="text-xs text-muted-foreground">
              {devotee.totalDonations > 0 ? "Contributed" : "No contributions yet"}
            </p>
          </CardContent>
        </Card>

        {/* Pujas Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Pujas Requested</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{devotee.totalPujas}</div>
            <p className="text-xs text-muted-foreground">
              {devotee.totalPujas === 1 ? "puja" : "pujas"} in total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
          <CardDescription>Personal contact details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {devotee.email && (
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Email</p>
                <p className="text-sm text-muted-foreground">{devotee.email}</p>
              </div>
            </div>
          )}
          {devotee.mobile && (
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Mobile</p>
                <p className="text-sm text-muted-foreground">{devotee.mobile}</p>
              </div>
            </div>
          )}
          {devotee.address && (
            <div className="flex items-start gap-3">
              <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Address</p>
                <p className="text-sm text-muted-foreground">{devotee.address}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>Additional details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm font-medium">Family Members</p>
              <p className="text-sm text-muted-foreground">{devotee.familyMembers} {devotee.familyMembers === 1 ? "member" : "members"}</p>
            </div>
            {devotee.dateOfBirth && (
              <div>
                <p className="text-sm font-medium">Date of Birth</p>
                <p className="text-sm text-muted-foreground">{formatDate(devotee.dateOfBirth)}</p>
              </div>
            )}
            {devotee.anniversary && (
              <div>
                <p className="text-sm font-medium">Anniversary</p>
                <p className="text-sm text-muted-foreground">{formatDate(devotee.anniversary)}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      {devotee.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{devotee.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
