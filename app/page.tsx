import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  // Redirect based on user role
  if (session.user.role === "ADMIN") {
    redirect("/admin/dashboard");
  } else {
    redirect("/dashboard");
  }
}
