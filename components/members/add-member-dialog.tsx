"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2, Plus } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { createMember } from "@/app/dashboard/members/actions"

const schema = z.object({
  name: z.string().min(2),
  designation: z.enum([
    "PRESIDENT","VICE_PRESIDENT","SECRETARY","JOINT_SECRETARY",
    "TREASURER","JOINT_TREASURER","MEMBER","VOLUNTEER",
  ]),
  mobile: z.string().optional(),
  email: z.string().optional(),
  address: z.string().optional(),
  canCollect: z.boolean().default(false),
  notes: z.string().optional(),
  
  createLogin: z.boolean().default(false),
  password: z.string().optional(),
  role: z.enum(["VIEWER", "DATA_ENTRY_OPERATOR", "ACCOUNTANT", "COMMITTEE_ADMIN", "SUPER_ADMIN"]).optional(),
}).refine(data => {
  if (data.createLogin) {
    return !!data.email && !!data.password && !!data.role
  }
  return true
}, { message: "Email, Password, and Role are required to create a login account", path: ["createLogin"] })

type FormData = z.infer<typeof schema>

export function AddMemberDialog() {
  const [open, setOpen] = React.useState(false)
  const [pending, startTransition] = React.useTransition()
  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: { designation: "MEMBER", canCollect: false, createLogin: false },
  })

  const createLogin = watch("createLogin")

  function onSubmit(data: FormData) {
    startTransition(async () => {
      const res = await createMember(data as any)
      if (res.error) toast.error(res.error)
      else { toast.success("Member added!"); reset(); setOpen(false) }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <Plus className="mr-2 h-4 w-4" /> Add Member
      </DialogTrigger>
      <DialogContent className="sm:max-w-[460px] max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Add Committee Member</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          {errors.createLogin && <p className="text-xs text-destructive">{errors.createLogin.message}</p>}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-2">
              <Label>Full Name *</Label>
              <Input {...register("name")} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Designation</Label>
              <Select onValueChange={(v) => setValue("designation", v as any)} defaultValue="MEMBER">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="PRESIDENT">President</SelectItem>
                  <SelectItem value="VICE_PRESIDENT">Vice President</SelectItem>
                  <SelectItem value="SECRETARY">Secretary</SelectItem>
                  <SelectItem value="JOINT_SECRETARY">Jt. Secretary</SelectItem>
                  <SelectItem value="TREASURER">Treasurer</SelectItem>
                  <SelectItem value="JOINT_TREASURER">Jt. Treasurer</SelectItem>
                  <SelectItem value="MEMBER">Member</SelectItem>
                  <SelectItem value="VOLUNTEER">Volunteer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Mobile</Label>
              <Input {...register("mobile")} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" {...register("email")} required={createLogin} />
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Input {...register("address")} />
            </div>
            <div className="col-span-2 flex items-center gap-2">
              <input type="checkbox" id="canCollect" {...register("canCollect")} className="h-4 w-4" />
              <Label htmlFor="canCollect" className="text-sm font-normal">
                Authorize this member to collect donations
              </Label>
            </div>

            <div className="col-span-2 pt-4 border-t">
              <div className="flex items-center gap-2 mb-4">
                <input type="checkbox" id="createLogin" {...register("createLogin")} className="h-4 w-4" />
                <Label htmlFor="createLogin" className="text-sm font-medium">
                  Create Login Account for this Member
                </Label>
              </div>
              
              {createLogin && (
                <div className="grid grid-cols-2 gap-4 p-4 border rounded-md bg-muted/30">
                  <div className="col-span-2 md:col-span-1 space-y-2">
                    <Label>Password *</Label>
                    <Input type="password" {...register("password")} required={createLogin} />
                  </div>
                  <div className="col-span-2 md:col-span-1 space-y-2">
                    <Label>System Role *</Label>
                    <Select onValueChange={(v) => setValue("role", v as any)}>
                      <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="VIEWER">Viewer</SelectItem>
                        <SelectItem value="DATA_ENTRY_OPERATOR">Data Entry Operator</SelectItem>
                        <SelectItem value="ACCOUNTANT">Accountant</SelectItem>
                        <SelectItem value="COMMITTEE_ADMIN">Committee Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>
            
          </div>
          <Button type="submit" className="w-full" disabled={pending}>
            {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save Member
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
