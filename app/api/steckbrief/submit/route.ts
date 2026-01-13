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

    // Check if already submitted
    if (profile.status !== 'DRAFT') {
      return NextResponse.json(
        { error: 'Der Steckbrief wurde bereits eingereicht.' },
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
