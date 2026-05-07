"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { createMember } from "@/app/dashboard/members/actions";

const schema = z
  .object({
    name: z.string().min(2),
    designation: z.enum([
      "PRESIDENT",
      "VICE_PRESIDENT",
      "SECRETARY",
      "JOINT_SECRETARY",
      "TREASURER",
      "JOINT_TREASURER",
      "MEMBER",
      "VOLUNTEER",
    ]),
    mobile: z.string().optional(),
    email: z.string().email("Enter a valid email").optional().or(z.literal("")),
    address: z.string().optional(),
    canCollect: z.boolean().default(false),
    status: z.enum(["ACTIVE", "RETIRED"]).default("ACTIVE"),
    notes: z.string().optional(),

    createLogin: z.boolean().default(false),
    password: z
      .string()
      .min(6, "Password must be at least 6 characters")
      .optional(),
    role: z
      .enum([
        "VIEWER",
        "DATA_ENTRY_OPERATOR",
        "ACCOUNTANT",
        "COMMITTEE_ADMIN",
        "SUPER_ADMIN",
      ])
      .optional(),
  })
  .refine(
    (data) => {
      if (data.createLogin) {
        return !!data.email && !!data.password && !!data.role;
      }
      return true;
    },
    {
      message:
        "Email, Password, and Role are required to create a login account",
      path: ["createLogin"],
    },
  );

type FormData = z.input<typeof schema>;

export function AddMemberDialog() {
  const [open, setOpen] = React.useState(false);
  const [pending, startTransition] = React.useTransition();
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      designation: "MEMBER",
      canCollect: false,
      createLogin: false,
    },
  });

  const createLogin = form.watch("createLogin");

  function onSubmit(data: FormData) {
    startTransition(async () => {
      const validated = schema.parse(data);
      const res = await createMember(validated);
      if (res.error) toast.error(res.error);
      else {
        toast.success("Member added!");
        form.reset();
        setOpen(false);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <Plus className="mr-2 h-4 w-4" /> Add Member
      </DialogTrigger>
      <DialogContent className="sm:max-w-[460px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Committee Member</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 mt-2"
          >
            <FormField
              control={form.control}
              name="createLogin"
              render={() => <FormMessage />}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Full Name *</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="designation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Designation</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="PRESIDENT">President</SelectItem>
                        <SelectItem value="VICE_PRESIDENT">
                          Vice President
                        </SelectItem>
                        <SelectItem value="SECRETARY">Secretary</SelectItem>
                        <SelectItem value="JOINT_SECRETARY">
                          Jt. Secretary
                        </SelectItem>
                        <SelectItem value="TREASURER">Treasurer</SelectItem>
                        <SelectItem value="JOINT_TREASURER">
                          Jt. Treasurer
                        </SelectItem>
                        <SelectItem value="MEMBER">Member</SelectItem>
                        <SelectItem value="VOLUNTEER">Volunteer</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="mobile"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mobile</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} required={createLogin} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="canCollect"
                render={({ field }) => (
                  <FormItem className="col-span-2 flex flex-row items-center gap-2 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="text-sm font-normal">
                      Authorize this member to collect donations
                    </FormLabel>
                  </FormItem>
                )}
              />

              <div className="col-span-2 pt-4 border-t">
                <FormField
                  control={form.control}
                  name="createLogin"
                  render={({ field }) => (
                    <FormItem className="mb-4 flex flex-row items-center gap-2 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="text-sm font-medium">
                        Create Login Account for this Member
                      </FormLabel>
                    </FormItem>
                  )}
                />

                {createLogin && (
                  <div className="grid grid-cols-2 gap-4 p-4 border rounded-md bg-muted/30">
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem className="col-span-2 md:col-span-1">
                          <FormLabel>Password *</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              {...field}
                              required={createLogin}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="role"
                      render={({ field }) => (
                        <FormItem className="col-span-2 md:col-span-1">
                          <FormLabel>System Role *</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select role" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="VIEWER">Viewer</SelectItem>
                              <SelectItem value="DATA_ENTRY_OPERATOR">
                                Data Entry Operator
                              </SelectItem>
                              <SelectItem value="ACCOUNTANT">
                                Accountant
                              </SelectItem>
                              <SelectItem value="COMMITTEE_ADMIN">
                                Committee Admin
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={pending}>
              {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{" "}
              Save Member
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
