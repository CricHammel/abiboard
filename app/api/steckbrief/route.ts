import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { FieldType } from "@prisma/client";
import {
  validateImageFile,
  saveImageFile,
  deleteImageFile,
} from "@/lib/file-upload";
import { isDeadlinePassed } from "@/lib/deadline";
import { logStudentActivity } from "@/lib/student-activity";
import {
  createDynamicValidationSchema,
  toFieldDefinition,
} from "@/lib/steckbrief-validation-dynamic";

// GET - Load own Steckbrief with fields and values
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Nicht authentifiziert." },
        { status: 401 }
      );
    }

    // Get or create profile
    let profile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
      include: {
        values: {
          include: {
            field: true,
          },
        },
      },
    });

    if (!profile) {
      // Auto-create profile for student
      profile = await prisma.profile.create({
        data: {
          userId: session.user.id,
        },
        include: {
          values: {
            include: {
              field: true,
            },
          },
        },
      });
    }

    // Get all active field definitions
    const fields = await prisma.steckbriefField.findMany({
      where: { active: true },
      orderBy: { order: "asc" },
    });

    // Build values map from SteckbriefValue records
    const values: Record<string, unknown> = {};
    for (const value of profile.values) {
      const field = value.field;
      if (!field.active) continue;

      switch (field.type) {
        case FieldType.TEXT:
        case FieldType.TEXTAREA:
        case FieldType.DATE:
          values[field.key] = value.textValue || "";
          break;
        case FieldType.SINGLE_IMAGE:
          values[field.key] = value.imageValue || null;
          break;
        case FieldType.MULTI_IMAGE:
          values[field.key] = value.imagesValue || [];
          break;
      }
    }

    // Return profile info, field definitions, and values
    return NextResponse.json(
      {
        profile: {
          id: profile.id,
          status: profile.status,
        },
        fields: fields.map(toFieldDefinition),
        values,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Steckbrief load error:", error);
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten." },
      { status: 500 }
    );
  }
}

// PATCH - Update Steckbrief (save as DRAFT)
export async function PATCH(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Nicht authentifiziert." },
        { status: 401 }
      );
    }

    if (await isDeadlinePassed()) {
      return NextResponse.json(
        { error: "Die Abgabefrist ist abgelaufen." },
        { status: 403 }
      );
    }

    // Get existing profile with values
    const existingProfile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
      include: {
        values: {
          include: {
            field: true,
          },
        },
      },
    });

    if (!existingProfile) {
      return NextResponse.json(
        { error: "Profil nicht gefunden." },
        { status: 404 }
      );
    }

    // Get all active field definitions
    const fields = await prisma.steckbriefField.findMany({
      where: { active: true },
      orderBy: { order: "asc" },
    });

    // Build map of existing values by field key
    const existingValuesByKey = new Map(
      existingProfile.values.map((v) => [v.field.key, v])
    );

    // Parse FormData
    const formData = await request.formData();

    // Extract text field values and validate
    const textData: Record<string, string> = {};
    for (const field of fields) {
      if (field.type === FieldType.TEXT || field.type === FieldType.TEXTAREA || field.type === FieldType.DATE) {
        const value = formData.get(field.key) as string;
        textData[field.key] = value || "";
      }
    }

    // Validate text fields dynamically
    const validationSchema = createDynamicValidationSchema(fields);
    const validation = validationSchema.safeParse(textData);
    if (!validation.success) {
      const errorMessage =
        validation.error.issues[0]?.message || "Ungültige Eingabedaten.";
      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }

    // Process each field and create/update SteckbriefValue records
    const valueUpserts: Array<{
      fieldId: string;
      textValue?: string | null;
      imageValue?: string | null;
      imagesValue?: string[];
    }> = [];

    for (const field of fields) {
      const existingValue = existingValuesByKey.get(field.key);

      switch (field.type) {
        case FieldType.TEXT:
        case FieldType.TEXTAREA:
        case FieldType.DATE: {
          const textValue = textData[field.key] || "";
          valueUpserts.push({
            fieldId: field.id,
            textValue: textValue || null,
          });
          break;
        }

        case FieldType.SINGLE_IMAGE: {
          const imageFile = formData.get(`image_${field.key}`) as File | null;
          let newImageUrl = existingValue?.imageValue || null;

          if (imageFile && imageFile.size > 0) {
            const imageValidation = validateImageFile(imageFile);
            if (!imageValidation.valid) {
              return NextResponse.json(
                { error: imageValidation.error },
                { status: 400 }
              );
            }

            // Delete old image if exists
            if (existingValue?.imageValue) {
              await deleteImageFile(existingValue.imageValue);
            }

            // Save new image
            newImageUrl = await saveImageFile(
              imageFile,
              session.user.id,
              field.key
            );
          }

          valueUpserts.push({
            fieldId: field.id,
            imageValue: newImageUrl,
          });
          break;
        }

        case FieldType.MULTI_IMAGE: {
          // Get existing images that should be kept
          const existingImagesJson = formData.get(
            `existing_${field.key}`
          ) as string;
          const existingImagesList = existingImagesJson
            ? (JSON.parse(existingImagesJson) as string[])
            : [];

          // Determine which images to delete (old ones not in existingImagesList)
          const currentImages = existingValue?.imagesValue || [];
          const imagesToDelete = currentImages.filter(
            (img) => !existingImagesList.includes(img)
          );

          // Delete removed images from filesystem
          for (const imagePath of imagesToDelete) {
            await deleteImageFile(imagePath);
          }

          // Get new image files
          const newImageFiles = formData.getAll(
            `new_${field.key}`
          ) as File[];
          const newImagePaths: string[] = [];

          // Validate total count
          const maxFiles = field.maxFiles || 3;
          const totalImages = existingImagesList.length + newImageFiles.length;
          if (totalImages > maxFiles) {
            return NextResponse.json(
              { error: `${field.label}: Maximal ${maxFiles} Bilder erlaubt.` },
              { status: 400 }
            );
          }

          // Validate and save each new file
          for (const file of newImageFiles) {
            if (file && file.size > 0) {
              const fileValidation = validateImageFile(file);
              if (!fileValidation.valid) {
                return NextResponse.json(
                  { error: fileValidation.error },
                  { status: 400 }
                );
              }

              const imagePath = await saveImageFile(
                file,
                session.user.id,
                field.key
              );
              newImagePaths.push(imagePath);
            }
          }

          // Combine existing + new images
          const finalImages = [...existingImagesList, ...newImagePaths];

          valueUpserts.push({
            fieldId: field.id,
            imagesValue: finalImages,
          });
          break;
        }
      }
    }

    // Execute all value upserts in a transaction
    await prisma.$transaction(
      valueUpserts.map((upsert) =>
        prisma.steckbriefValue.upsert({
          where: {
            profileId_fieldId: {
              profileId: existingProfile.id,
              fieldId: upsert.fieldId,
            },
          },
          update: {
            textValue: upsert.textValue,
            imageValue: upsert.imageValue,
            imagesValue: upsert.imagesValue,
          },
          create: {
            profileId: existingProfile.id,
            fieldId: upsert.fieldId,
            textValue: upsert.textValue,
            imageValue: upsert.imageValue,
            imagesValue: upsert.imagesValue,
          },
        })
      )
    );

    // Auto-retract: if submitted, reset to DRAFT on edit
    const wasSubmitted = existingProfile.status === "SUBMITTED";
    await prisma.profile.update({
      where: { id: existingProfile.id },
      data: {
        updatedAt: new Date(),
        ...(wasSubmitted && { status: "DRAFT" }),
      },
    });

    if (wasSubmitted) {
      await logStudentActivity({
        userId: session.user.id,
        action: "RETRACT",
        entity: "Steckbrief",
      });
    }

    // Fetch updated values for response
    const updatedProfile = await prisma.profile.findUnique({
      where: { id: existingProfile.id },
      include: {
        values: {
          include: {
            field: true,
          },
        },
      },
    });

    // Build updated values map
    const updatedValues: Record<string, unknown> = {};
    for (const value of updatedProfile!.values) {
      const f = value.field;
      if (!f.active) continue;

      switch (f.type) {
        case FieldType.TEXT:
        case FieldType.TEXTAREA:
        case FieldType.DATE:
          updatedValues[f.key] = value.textValue || "";
          break;
        case FieldType.SINGLE_IMAGE:
          updatedValues[f.key] = value.imageValue || null;
          break;
        case FieldType.MULTI_IMAGE:
          updatedValues[f.key] = value.imagesValue || [];
          break;
      }
    }

    return NextResponse.json(
      {
        message: "Steckbrief gespeichert.",
        profile: {
          id: updatedProfile!.id,
          status: updatedProfile!.status,
        },
        values: updatedValues,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Steckbrief update error:", error);
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten. Bitte versuche es erneut." },
      { status: 500 }
    );
  }
}
