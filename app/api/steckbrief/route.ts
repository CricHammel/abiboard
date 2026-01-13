import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { steckbriefUpdateSchema } from '@/lib/steckbrief-validation';
import {
  validateImageFile,
  saveImageFile,
  deleteImageFile,
} from '@/lib/file-upload';

// GET - Load own Steckbrief
export async function GET(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Nicht authentifiziert.' },
        { status: 401 }
      );
    }

    // Get or create profile
    let profile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
    });

    if (!profile) {
      // Auto-create profile for student
      profile = await prisma.profile.create({
        data: {
          userId: session.user.id,
        },
      });
    }

    return NextResponse.json({ profile }, { status: 200 });
  } catch (error) {
    console.error('Steckbrief load error:', error);
    return NextResponse.json(
      { error: 'Ein Fehler ist aufgetreten.' },
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
        { error: 'Nicht authentifiziert.' },
        { status: 401 }
      );
    }

    // Get existing profile
    const existingProfile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
    });

    if (!existingProfile) {
      return NextResponse.json(
        { error: 'Profil nicht gefunden.' },
        { status: 404 }
      );
    }

    // Check if profile is not already submitted/approved
    if (existingProfile.status !== 'DRAFT') {
      return NextResponse.json(
        { error: 'Der Steckbrief kann nicht mehr bearbeitet werden.' },
        { status: 403 }
      );
    }

    // Parse FormData
    const formData = await request.formData();

    // Extract text fields
    const textData = {
      quote: formData.get('quote') as string,
      plansAfter: formData.get('plansAfter') as string,
      memory: formData.get('memory') as string,
    };

    // Validate text fields
    const validation = steckbriefUpdateSchema.safeParse(textData);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Ungültige Eingabedaten.' },
        { status: 400 }
      );
    }

    // Handle profile image upload
    let newImageUrl = existingProfile.imageUrl;
    const imageFile = formData.get('imageUrl') as File | null;

    if (imageFile && imageFile.size > 0) {
      const imageValidation = validateImageFile(imageFile);
      if (!imageValidation.valid) {
        return NextResponse.json(
          { error: imageValidation.error },
          { status: 400 }
        );
      }

      // Delete old image if exists
      if (existingProfile.imageUrl) {
        await deleteImageFile(existingProfile.imageUrl);
      }

      // Save new image
      newImageUrl = await saveImageFile(
        imageFile,
        session.user.id,
        'profile'
      );
    }

    // Handle memory images upload (incremental)
    const existingMemoryImagesJson = formData.get('existingMemoryImages') as string;
    const existingMemoryImagesList = existingMemoryImagesJson
      ? JSON.parse(existingMemoryImagesJson) as string[]
      : [];

    // Determine which images to delete (old ones not in existingMemoryImagesList)
    const imagesToDelete = existingProfile.memoryImages.filter(
      img => !existingMemoryImagesList.includes(img)
    );

    // Delete removed images from filesystem
    for (const imagePath of imagesToDelete) {
      await deleteImageFile(imagePath);
    }

    // Get new memory image files
    const newMemoryImagesFiles = formData.getAll('newMemoryImages') as File[];
    const newImagePaths: string[] = [];

    // Validate total count
    const totalImages = existingMemoryImagesList.length + newMemoryImagesFiles.length;
    if (totalImages > 3) {
      return NextResponse.json(
        { error: 'Maximal 3 Erinnerungsfotos erlaubt.' },
        { status: 400 }
      );
    }

    // Validate and save each new file
    for (const file of newMemoryImagesFiles) {
      if (file && file.size > 0) {
        const validation = validateImageFile(file);
        if (!validation.valid) {
          return NextResponse.json(
            { error: validation.error },
            { status: 400 }
          );
        }

        const imagePath = await saveImageFile(
          file,
          session.user.id,
          'memory'
        );
        newImagePaths.push(imagePath);
      }
    }

    // Combine existing + new memory images
    const finalMemoryImages = [...existingMemoryImagesList, ...newImagePaths];

    // Update profile
    const updatedProfile = await prisma.profile.update({
      where: { userId: session.user.id },
      data: {
        quote: validation.data.quote,
        plansAfter: validation.data.plansAfter,
        memory: validation.data.memory,
        imageUrl: newImageUrl,
        memoryImages: finalMemoryImages,
      },
    });

    return NextResponse.json(
      {
        message: 'Steckbrief gespeichert.',
        profile: updatedProfile,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Steckbrief update error:', error);
    return NextResponse.json(
      { error: 'Ein Fehler ist aufgetreten. Bitte versuche es erneut.' },
      { status: 500 }
    );
  }
}
