import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { SteckbriefForm } from '@/components/steckbrief/SteckbriefForm';
import { Card } from '@/components/ui/Card';

export default async function SteckbriefPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  // Load profile
  let profile = await prisma.profile.findUnique({
    where: { userId: session.user.id },
  });

  // Auto-create if doesn't exist
  if (!profile) {
    profile = await prisma.profile.create({
      data: {
        userId: session.user.id,
      },
    });
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Mein Steckbrief</h1>
        <p className="mt-2 text-gray-600">
          Fülle deine Informationen für das Abibuch aus. Du kannst deine Angaben
          jederzeit als Entwurf speichern und später weiter bearbeiten.
        </p>
      </div>

      <Card>
        <SteckbriefForm
          initialData={{
            imageUrl: profile.imageUrl,
            quote: profile.quote,
            plansAfter: profile.plansAfter,
            memory: profile.memory,
            memoryImages: profile.memoryImages,
            status: profile.status,
          }}
        />
      </Card>
    </div>
  );
}
