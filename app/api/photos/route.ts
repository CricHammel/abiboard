import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { isDeadlinePassed } from "@/lib/deadline";
import { validatePhotoFile, savePhotoFile } from "@/lib/file-upload";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Nicht authentifiziert." },
        { status: 401 }
      );
    }

    const categories = await prisma.photoCategory.findMany({
      where: { active: true },
      orderBy: { order: "asc" },
      include: {
        _count: {
          select: { photos: true },
        },
        photos: {
          take: 1,
          orderBy: { createdAt: "desc" },
          select: { imageUrl: true, userId: true },
        },
      },
    });

    // Get user's photo counts per category
    const userPhotoCounts = await prisma.photo.groupBy({
      by: ["categoryId"],
      where: {
        userId: session.user.id,
        category: { active: true },
      },
      _count: { id: true },
    });

    const userCountMap = new Map(
      userPhotoCounts.map((c) => [c.categoryId, c._count.id])
    );

    const categoriesOverview = categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      description: cat.description,
      coverImageUrl: cat.coverImageUrl,
      maxPerUser: cat.maxPerUser,
      photoCount: cat._count.photos,
      userPhotoCount: userCountMap.get(cat.id) ?? 0,
      firstPhotoUrl: cat.photos[0]?.imageUrl ?? null,
    }));

    return NextResponse.json({ categories: categoriesOverview }, { status: 200 });
  } catch (error) {
    console.error("Photos fetch error:", error);
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten. Bitte versuche es erneut." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Nicht authentifiziert." },
        { status: 401 }
      );
    }

    // Deadline check
    const deadlinePassed = await isDeadlinePassed();
    if (deadlinePassed) {
      return NextResponse.json(
        { error: "Die Abgabefrist ist abgelaufen. Fotos können nicht mehr hochgeladen werden." },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const categoryId = formData.get("categoryId") as string | null;

    if (!file || !categoryId) {
      return NextResponse.json(
        { error: "Datei und Rubrik sind erforderlich." },
        { status: 400 }
      );
    }

    // Validate file
    const validation = validatePhotoFile(file);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    // Check category exists and is active
    const category = await prisma.photoCategory.findUnique({
      where: { id: categoryId },
    });

    if (!category || !category.active) {
      return NextResponse.json(
        { error: "Rubrik nicht gefunden oder nicht aktiv." },
        { status: 404 }
      );
    }

    // Check maxPerUser limit
    const userPhotoCount = await prisma.photo.count({
      where: {
        categoryId,
        userId: session.user.id,
      },
    });

    if (userPhotoCount >= category.maxPerUser) {
      return NextResponse.json(
        {
          error: `Du hast bereits die maximale Anzahl von ${category.maxPerUser} Fotos in dieser Rubrik erreicht.`,
        },
        { status: 400 }
      );
    }

    // Save file
    const imageUrl = await savePhotoFile(file, session.user.id, categoryId);

    // Create database record
    const photo = await prisma.photo.create({
      data: {
        imageUrl,
        categoryId,
        userId: session.user.id,
      },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    // Auto-set as cover if no cover exists yet
    if (!category.coverImageUrl) {
      await prisma.photoCategory.update({
        where: { id: categoryId },
        data: { coverImageUrl: imageUrl },
      });
    }

    return NextResponse.json(
      {
        message: "Foto erfolgreich hochgeladen.",
        photo: {
          id: photo.id,
          imageUrl: photo.imageUrl,
          createdAt: photo.createdAt.toISOString(),
          user: photo.user,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Photo upload error:", error);
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten. Bitte versuche es erneut." },
      { status: 500 }
    );
  }
}
