import { Metadata } from "next";
import { Card } from "@/components/ui/Card";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Anmelden - AbiBoard",
  description: "Melde dich an, um auf AbiBoard zuzugreifen.",
};

export default function LoginPage() {
  return (
    <Card>
      <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
        Anmelden
      </h2>
      <LoginForm />
    </Card>
  );
}
