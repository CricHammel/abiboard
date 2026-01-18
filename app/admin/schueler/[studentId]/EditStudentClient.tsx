"use client";

import { useRouter } from "next/navigation";
import { StudentForm } from "@/components/admin/StudentForm";

interface EditStudentClientProps {
  student: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    active: boolean;
    userId: string | null;
  };
}

export function EditStudentClient({ student }: EditStudentClientProps) {
  const router = useRouter();

  const handleSuccess = () => {
    router.push("/admin/schueler");
  };

  return (
    <StudentForm mode="edit" initialData={student} onSuccess={handleSuccess} />
  );
}
