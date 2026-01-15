import { PrismaClient, FieldType } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Initial Steckbrief field definitions
const INITIAL_FIELDS = [
  {
    key: "imageUrl",
    type: FieldType.SINGLE_IMAGE,
    label: "Profilbild",
    order: 1,
  },
  {
    key: "quote",
    type: FieldType.TEXTAREA,
    label: "Lieblingszitat",
    placeholder: 'z.B. "Carpe Diem"',
    maxLength: 500,
    rows: 3,
    order: 2,
  },
  {
    key: "plansAfter",
    type: FieldType.TEXTAREA,
    label: "Pläne nach dem Abi",
    placeholder: "Was sind deine Pläne für die Zukunft?",
    maxLength: 1000,
    rows: 4,
    order: 3,
  },
  {
    key: "memory",
    type: FieldType.TEXTAREA,
    label: "Schönste Erinnerung",
    placeholder: "Was war deine schönste Erinnerung an die Schulzeit?",
    maxLength: 1000,
    rows: 4,
    order: 4,
  },
  {
    key: "memoryImages",
    type: FieldType.MULTI_IMAGE,
    label: "Erinnerungsfotos",
    maxFiles: 3,
    order: 5,
  },
];

async function seedSteckbriefFields() {
  console.log("Seeding Steckbrief fields...");

  for (const field of INITIAL_FIELDS) {
    await prisma.steckbriefField.upsert({
      where: { key: field.key },
      update: {
        label: field.label,
        placeholder: field.placeholder,
        maxLength: field.maxLength,
        maxFiles: field.maxFiles,
        rows: field.rows,
        order: field.order,
      },
      create: field,
    });
  }

  console.log(`Created/updated ${INITIAL_FIELDS.length} Steckbrief fields`);
}

async function migrateProfileData() {
  console.log("Migrating existing profile data to SteckbriefValue...");

  // Get all field definitions
  const fields = await prisma.steckbriefField.findMany();
  const fieldMap = new Map(fields.map((f) => [f.key, f]));

  // Get all profiles with their legacy data
  const profiles = await prisma.profile.findMany({
    select: {
      id: true,
      imageUrl: true,
      quote: true,
      plansAfter: true,
      memory: true,
      memoryImages: true,
    },
  });

  let migratedCount = 0;

  for (const profile of profiles) {
    const valuesToCreate: Array<{
      profileId: string;
      fieldId: string;
      textValue?: string;
      imageValue?: string;
      imagesValue?: string[];
    }> = [];

    // Migrate imageUrl (single-image)
    if (profile.imageUrl && fieldMap.has("imageUrl")) {
      valuesToCreate.push({
        profileId: profile.id,
        fieldId: fieldMap.get("imageUrl")!.id,
        imageValue: profile.imageUrl,
      });
    }

    // Migrate quote (textarea)
    if (profile.quote && fieldMap.has("quote")) {
      valuesToCreate.push({
        profileId: profile.id,
        fieldId: fieldMap.get("quote")!.id,
        textValue: profile.quote,
      });
    }

    // Migrate plansAfter (textarea)
    if (profile.plansAfter && fieldMap.has("plansAfter")) {
      valuesToCreate.push({
        profileId: profile.id,
        fieldId: fieldMap.get("plansAfter")!.id,
        textValue: profile.plansAfter,
      });
    }

    // Migrate memory (textarea)
    if (profile.memory && fieldMap.has("memory")) {
      valuesToCreate.push({
        profileId: profile.id,
        fieldId: fieldMap.get("memory")!.id,
        textValue: profile.memory,
      });
    }

    // Migrate memoryImages (multi-image)
    if (
      profile.memoryImages &&
      profile.memoryImages.length > 0 &&
      fieldMap.has("memoryImages")
    ) {
      valuesToCreate.push({
        profileId: profile.id,
        fieldId: fieldMap.get("memoryImages")!.id,
        imagesValue: profile.memoryImages,
      });
    }

    // Insert values (skip if already exists)
    for (const value of valuesToCreate) {
      try {
        await prisma.steckbriefValue.upsert({
          where: {
            profileId_fieldId: {
              profileId: value.profileId,
              fieldId: value.fieldId,
            },
          },
          update: {
            textValue: value.textValue,
            imageValue: value.imageValue,
            imagesValue: value.imagesValue,
          },
          create: value,
        });
        migratedCount++;
      } catch {
        // Skip if constraint violation (already migrated)
      }
    }
  }

  console.log(`Migrated ${migratedCount} field values from ${profiles.length} profiles`);
}

async function main() {
  // Seed Steckbrief fields first
  await seedSteckbriefFields();

  // Migrate existing profile data to new system
  await migrateProfileData();

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

  // Migrate demo student data if just created
  await migrateProfileData();

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
