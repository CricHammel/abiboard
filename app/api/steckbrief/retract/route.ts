import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Nicht authentifiziert.' },
        { status: 401 }
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

    // Check if status is SUBMITTED (can only retract if submitted)
    if (profile.status !== 'SUBMITTED') {
      return NextResponse.json(
        { error: 'Nur eingereichte Steckbriefe können zurückgezogen werden.' },
        { status: 400 }
      );
    }

    // Update status back to DRAFT and clear feedback
    const updatedProfile = await prisma.profile.update({
      where: { userId: session.user.id },
      data: {
        status: 'DRAFT',
        feedback: null, // Clear any existing feedback
      },
    });

    return NextResponse.json(
      {
        message: 'Einreichung erfolgreich zurückgezogen.',
        profile: updatedProfile,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Steckbrief retract error:', error);
    return NextResponse.json(
      { error: 'Ein Fehler ist aufgetreten. Bitte versuche es erneut.' },
      { status: 500 }
    );
  }
}
