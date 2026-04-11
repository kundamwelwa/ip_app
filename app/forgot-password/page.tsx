"use client";

import { Suspense } from "react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export default function ForgotPasswordPage() {
  return (
    <AuthLayout>
      <Suspense fallback={null}>
        <ForgotPasswordForm />
      </Suspense>
    </AuthLayout>
  );
}

