"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

import { AuthLayout } from "@/components/auth/AuthLayout";
import { LoginForm } from "@/components/auth/LoginForm";

// ─── Reads ?message= and shows a success dialog ───────────────────────────────
function ParamHandler() {
  const searchParams = useSearchParams();
  const message = searchParams.get("message");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (message) setOpen(true);
  }, [message]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="bg-slate-900 border border-amber-500/30 text-white shadow-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-400" />
            <DialogTitle>Success</DialogTitle>
          </div>
          <DialogDescription className="text-amber-100/70">{message}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            className="bg-amber-500 hover:bg-amber-600 text-slate-900"
            onClick={() => setOpen(false)}
          >
            Got it
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Inner page (needs Suspense for useSearchParams) ─────────────────────────
function LoginPageInner() {
  return (
    <>
      <Suspense>
        <ParamHandler />
      </Suspense>
      <AuthLayout>
        <LoginForm />
      </AuthLayout>
    </>
  );
}

// ─── Default export ───────────────────────────────────────────────────────────
export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center" style={{ background: "#0a0e14" }} />
      }
    >
      <LoginPageInner />
    </Suspense>
  );
}
