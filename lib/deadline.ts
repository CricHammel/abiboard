import { prisma } from "@/lib/prisma";

export async function getDeadline(): Promise<Date | null> {
  const settings = await prisma.appSettings.findFirst();
  return settings?.deadline ?? null;
}

export async function isDeadlinePassed(): Promise<boolean> {
  const deadline = await getDeadline();
  if (!deadline) return false;
  return new Date() > deadline;
}
