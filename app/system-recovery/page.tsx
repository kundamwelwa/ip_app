import { AuthLayout } from "@/components/auth/AuthLayout";
import { SystemRecoveryForm } from "@/components/auth/SystemRecoveryForm";

export default function SystemRecoveryPage() {
  return (
    <AuthLayout>
      <SystemRecoveryForm />
    </AuthLayout>
  );
}
