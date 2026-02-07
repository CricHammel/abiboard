import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { isDeadlinePassed } from '@/lib/deadline';
import { logStudentActivity } from '@/lib/student-activity';
import { validateRequiredFields } from '@/lib/steckbrief-validation-dynamic';
import { FieldType } from '@prisma/client';

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Nicht authentifiziert.' },
        { status: 401 }
      );
    }

    if (await isDeadlinePassed()) {
      return NextResponse.json(
        { error: 'Die Abgabefrist ist abgelaufen.' },
        { status: 403 }
      );
    }

    // Get profile
    const profile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
    });

    if (!profile) {
      return NextResponse.json(
        { error: 'Profil nicht gefunden.' },
        { status: 404 }
      );
    }

    // If already submitted, return success (idempotent)
    if (profile.status === 'SUBMITTED') {
      return NextResponse.json(
        { message: 'Steckbrief ist bereits eingereicht.', profile },
        { status: 200 }
      );
    }

    // Validate required fields before submission
    const activeFields = await prisma.steckbriefField.findMany({
      where: { active: true },
      orderBy: { order: 'asc' },
    });

    const steckbriefValues = await prisma.steckbriefValue.findMany({
      where: { profileId: profile.id },
      include: { field: true },
    });

    // Build a values record keyed by field key
    const valuesRecord: Record<string, unknown> = {};
    for (const sv of steckbriefValues) {
      switch (sv.field.type) {
        case FieldType.TEXT:
        case FieldType.TEXTAREA:
        case FieldType.DATE:
          valuesRecord[sv.field.key] = sv.textValue || '';
          break;
        case FieldType.SINGLE_IMAGE:
          valuesRecord[sv.field.key] = sv.imageValue || null;
          break;
        case FieldType.MULTI_IMAGE:
          valuesRecord[sv.field.key] = sv.imagesValue || [];
          break;
      }
    }

    const requiredErrors = validateRequiredFields(activeFields, valuesRecord);
    if (requiredErrors.length > 0) {
      return NextResponse.json(
        { error: 'Bitte fülle alle Pflichtfelder aus.', details: requiredErrors },
        { status: 400 }
      );
    }

    // Update status to SUBMITTED
    const updatedProfile = await prisma.profile.update({
      where: { userId: session.user.id },
      data: {
        status: 'SUBMITTED',
      },
    });

    await logStudentActivity({
      userId: session.user.id,
      action: "SUBMIT",
      entity: "Steckbrief",
    });

    return NextResponse.json(
      {
        message: 'Steckbrief erfolgreich eingereicht.',
        profile: updatedProfile,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Steckbrief submit error:', error);
    return NextResponse.json(
      { error: 'Ein Fehler ist aufgetreten. Bitte versuche es erneut.' },
      { status: 500 }
    );
  }
}
