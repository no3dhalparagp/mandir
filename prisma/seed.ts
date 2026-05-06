import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  const hashedPassword = await bcrypt.hash("admin123", 10)

  const admin = await prisma.user.upsert({
    where: { email: "admin@mandir.com" },
    update: {},
    create: {
      email: "admin@mandir.com",
      name: "Super Admin",
      password: hashedPassword,
      role: "SUPER_ADMIN",
    },
  })

  console.log("Database seeded with admin user:", admin.email)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
