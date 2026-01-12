import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Hash password for demo users
  const hashedPassword = await bcrypt.hash("password123", 10);

  // Create admin user
  const admin = await prisma.user.upsert({
    where: { email: "admin@abibuch.de" },
    update: {},
    create: {
      email: "admin@abibuch.de",
      password: hashedPassword,
      firstName: "Admin",
      lastName: "User",
      role: "ADMIN",
    },
  });

  // Create student user
  const student = await prisma.user.upsert({
    where: { email: "student@abibuch.de" },
    update: {},
    create: {
      email: "student@abibuch.de",
      password: hashedPassword,
      firstName: "Max",
      lastName: "Mustermann",
      role: "STUDENT",
      profile: {
        create: {
          quote: "Das war eine geile Zeit!",
          plansAfter: "Studium in München",
          memory: "Die Abifahrt nach Barcelona",
          status: "DRAFT",
        },
      },
    },
  });

  console.log({ admin, student });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
