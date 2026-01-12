import { Metadata } from "next";
import { Card } from "@/components/ui/Card";
import { RegisterForm } from "@/components/auth/RegisterForm";

export const metadata: Metadata = {
  title: "Registrieren - Abibuch",
  description: "Erstelle ein Konto für dein Abibuch.",
};

export default function RegisterPage() {
  return (
    <Card>
      <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
        Registrieren
      </h2>
      <RegisterForm />
    </Card>
  );
}
