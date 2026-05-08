"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { donationCreateSchema } from "@/lib/validation-schemas"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, AlertCircle, Info } from "lucide-react"
import { handleFormSubmit, formatCurrencyInput, showSuccessToast } from "@/lib/form-utils"

const DONATION_TYPES = [
  { value: "CASH", label: "Cash" },
  { value: "CHECK", label: "Check" },
  { value: "BANK_TRANSFER", label: "Bank Transfer" },
  { value: "ONLINE", label: "Online/Digital" },
  { value: "KIND", label: "In-Kind" },
]

const PURPOSES = [
  { value: "GENERAL", label: "General Donation" },
  { value: "MAINTENANCE", label: "Temple Maintenance" },
  { value: "DEITY", label: "Deity Offerings" },
  { value: "PUJA", label: "Puja Sponsorship" },
  { value: "PRASAD", label: "Prasad Distribution" },
  { value: "CHARITY", label: "Charity/Welfare" },
  { value: "EDUCATION", label: "Education Programs" },
  { value: "MEDICAL", label: "Medical Assistance" },
  { value: "SPECIAL_CAUSE", label: "Special Cause" },
]

interface DonationFormProps {
  initialData?: any
  isEditing?: boolean
}

export function DonationForm({ initialData, isEditing = false }: DonationFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [donationType, setDonationType] = useState(initialData?.donationType || "CASH")

  const form = useForm({
    resolver: zodResolver(donationCreateSchema),
    defaultValues: initialData || {
      donationType: "CASH",
      purpose: "GENERAL",
      amount: "",
      donationDate: new Date().toISOString().slice(0, 16),
      donorName: "",
      donorEmail: "",
      donorPhone: "",
      notes: "",
    },
  })

  async function onSubmit(data: any) {
    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const endpoint = isEditing 
        ? `/api/mandir-donations/${initialData.id}`
        : "/api/mandir-donations"
      
      const method = isEditing ? "PUT" : "POST"

      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        setSubmitError(result.error || "Failed to save donation")
        return
      }

      showSuccessToast(
        isEditing ? "Donation updated successfully" : "Donation recorded successfully"
      )
      
      router.push(`/dashboard/mandir-donations/${result.data.id}`)
    } catch (error) {
      console.error("[v0] Form submission error:", error)
      setSubmitError("An error occurred. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditing ? "Edit Donation" : "Record Donation"}</CardTitle>
        <CardDescription>
          {isEditing 
            ? "Update donation details" 
            : "Record a new donation to the temple"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {submitError && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{submitError}</AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="payment">Payment Details</TabsTrigger>
                <TabsTrigger value="donor">Donor Info</TabsTrigger>
              </TabsList>

              {/* Basic Information Tab */}
              <TabsContent value="basic" className="space-y-4">
                <FormField
                  control={form.control}
                  name="donationType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Donation Type *</FormLabel>
                      <Select 
                        value={field.value} 
                        onValueChange={(value) => {
                          field.onChange(value)
                          setDonationType(value)
                        }}
                        disabled={isSubmitting}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {DONATION_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="purpose"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Purpose of Donation *</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange} disabled={isSubmitting}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {PURPOSES.map((purpose) => (
                            <SelectItem key={purpose.value} value={purpose.value}>
                              {purpose.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="donationDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Donation Date *</FormLabel>
                      <FormControl>
                        <Input 
                          type="datetime-local"
                          {...field}
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {donationType === "KIND" ? (
                  <>
                    <FormField
                      control={form.control}
                      name="itemDescription"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Item Description *</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="What is being donated?" 
                              {...field}
                              disabled={isSubmitting}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="itemQuantity"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Quantity</FormLabel>
                            <FormControl>
                              <Input 
                                type="number"
                                placeholder="1" 
                                {...field}
                                disabled={isSubmitting}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="itemUnit"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Unit</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Kg, L, Box, etc." 
                                {...field}
                                disabled={isSubmitting}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </>
                ) : (
                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Amount (₹) *</FormLabel>
                        <FormControl>
                          <Input 
                            type="number"
                            placeholder="0.00"
                            step="0.01"
                            min="0"
                            {...field}
                            onChange={(e) => {
                              const formatted = formatCurrencyInput(e.target.value)
                              field.onChange(formatted)
                            }}
                            disabled={isSubmitting}
                          />
                        </FormControl>
                        <FormDescription>Enter the donation amount</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </TabsContent>

              {/* Payment Details Tab */}
              <TabsContent value="payment" className="space-y-4">
                {donationType === "CHECK" && (
                  <>
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertDescription>
                        Please provide check details below
                      </AlertDescription>
                    </Alert>
                    <FormField
                      control={form.control}
                      name="chequeNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Check Number</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Check number" 
                              {...field}
                              disabled={isSubmitting}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="chequeDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Check Date</FormLabel>
                          <FormControl>
                            <Input 
                              type="datetime-local"
                              {...field}
                              disabled={isSubmitting}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="bankName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bank Name</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Issuing bank name" 
                              {...field}
                              disabled={isSubmitting}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}

                {donationType === "BANK_TRANSFER" && (
                  <FormField
                    control={form.control}
                    name="bankName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bank Name</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Transfer from bank" 
                            {...field}
                            disabled={isSubmitting}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {donationType !== "KIND" && donationType !== "CASH" && (
                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Amount (₹) *</FormLabel>
                        <FormControl>
                          <Input 
                            type="number"
                            placeholder="0.00"
                            step="0.01"
                            min="0"
                            {...field}
                            disabled={isSubmitting}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </TabsContent>

              {/* Donor Information Tab */}
              <TabsContent value="donor" className="space-y-4">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Optional: Provide donor details for acknowledgment
                  </AlertDescription>
                </Alert>

                <FormField
                  control={form.control}
                  name="donorName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Donor Name</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Full name" 
                          {...field}
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="donorEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input 
                          type="email"
                          placeholder="email@example.com" 
                          {...field}
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="donorPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="10-digit number" 
                          {...field}
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Additional Notes</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Any special notes..." 
                          {...field}
                          disabled={isSubmitting}
                          className="resize-none"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>
            </Tabs>

            {/* Submit Buttons */}
            <div className="flex gap-4 justify-end pt-6 border-t">
              <Button 
                type="button" 
                variant="outline"
                onClick={() => router.back()}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  isEditing ? "Update Donation" : "Record Donation"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
