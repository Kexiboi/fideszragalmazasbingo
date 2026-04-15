import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { DEFAULT_BINGO_TEXTS } from "./bingo-items";

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@localhost";
  const adminPassword = process.env.ADMIN_PASSWORD ?? "admin123";
  const passwordHash = await bcrypt.hash(adminPassword, 12);

  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!existingAdmin) {
    await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash,
        name: "Admin",
      },
    });
  }

  const existingCount = await prisma.bingoItem.count();
  if (existingCount === 0) {
    await prisma.bingoItem.createMany({
      data: DEFAULT_BINGO_TEXTS.map((text, sortOrder) => ({
        text,
        sortOrder,
        active: true,
      })),
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e: unknown) => {
    await prisma.$disconnect();
    throw e;
  });
