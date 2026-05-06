"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { MemberDesignation, MemberStatus } from "@prisma/client"

import { Role } from "@prisma/client"
import bcrypt from "bcryptjs"

const memberSchema = z.object({
  name: z.string().min(2, "Name is required"),
  designation: z.nativeEnum(MemberDesignation),
  mobile: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  address: z.string().optional(),
  canCollect: z.boolean().default(false),
  notes: z.string().optional(),
  status: z.nativeEnum(MemberStatus).default("ACTIVE"),
  
  // Login fields
  createLogin: z.boolean().default(false),
  password: z.string().optional(),
  role: z.nativeEnum(Role).optional(),
}).refine(data => {
  if (data.createLogin) {
    return !!data.email && !!data.password && !!data.role
  }
  return true
}, { message: "Email, Password, and Role are required to create a login account", path: ["createLogin"] })

export async function getMembers() {
  return prisma.member.findMany({ orderBy: { createdAt: "desc" } })
}

export async function createMember(data: z.infer<typeof memberSchema>) {
  try {
    const validated = memberSchema.parse(data)

    // Auto-generate memberId
    const count = await prisma.member.count()
    const memberId = `MEM-${String(count + 1).padStart(4, "0")}`

    const member = await prisma.$transaction(async (tx) => {
      let createdUserId = undefined

      if (validated.createLogin && validated.email && validated.password && validated.role) {
        // Check if user already exists
        const existing = await tx.user.findUnique({ where: { email: validated.email } })
        if (existing) throw new Error("A user with this email already exists.")

        const hashedPassword = await bcrypt.hash(validated.password, 10)
        
        const user = await tx.user.create({
          data: {
            name: validated.name,
            email: validated.email,
            password: hashedPassword,
            role: validated.role,
          }
        })
        createdUserId = user.id
      }

      return tx.member.create({
        data: { 
          name: validated.name,
          designation: validated.designation,
          mobile: validated.mobile,
          email: validated.email,
          address: validated.address,
          canCollect: validated.canCollect,
          notes: validated.notes,
          status: validated.status,
          memberId,
          userId: createdUserId
        },
      })
    })

    revalidatePath("/dashboard/members")
    return { success: true, data: member }
  } catch (error: any) {
    console.error(error)
    return { error: error.message || "Failed to create member." }
  }
}

export async function updateMember(id: string, data: Partial<z.infer<typeof memberSchema>>) {
  try {
    const member = await prisma.member.update({ where: { id }, data })
    revalidatePath("/dashboard/members")
    return { success: true, data: member }
  } catch {
    return { error: "Failed to update member." }
  }
}
