import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ categoryId: string }> }
) {
  try {
    const { categoryId } = await params;
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Nicht authentifiziert." },
        { status: 401 }
      );
    }

    const category = await prisma.photoCategory.findUnique({
      where: { id: categoryId, active: true },
      select: {
        id: true,
        name: true,
        description: true,
        coverImageUrl: true,
        maxPerUser: true,
      },
    });

    if (!category) {
      return NextResponse.json(
        { error: "Rubrik nicht gefunden." },
        { status: 404 }
      );
    }

    const photos = await prisma.photo.findMany({
      where: { categoryId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        imageUrl: true,
        createdAt: true,
        userId: true,
        user: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    // Separate own and other photos, anonymize other users
    const photosWithOwnership = photos.map((photo) => {
      const isOwn = photo.userId === session.user.id;
      return {
        id: photo.id,
        imageUrl: photo.imageUrl,
        createdAt: photo.createdAt.toISOString(),
        isOwn,
        // Only include user data for own photos
        user: isOwn ? photo.user : undefined,
      };
    });

    const userPhotoCount = photos.filter(
      (p) => p.userId === session.user.id
    ).length;

    return NextResponse.json(
      {
        category,
        photos: photosWithOwnership,
        userPhotoCount,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Category photos fetch error:", error);
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten. Bitte versuche es erneut." },
      { status: 500 }
    );
  }
}
