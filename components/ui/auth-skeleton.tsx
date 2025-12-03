"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function AuthFormSkeleton() {
  return (
    <div className="w-full max-w-md">
      <Card className="border-amber-500/20 bg-gradient-to-br from-slate-900/95 via-zinc-900/95 to-slate-900/95 backdrop-blur-xl shadow-2xl">
        <CardHeader className="space-y-3">
          <Skeleton className="h-8 w-3/4 mx-auto bg-amber-500/10" />
          <Skeleton className="h-4 w-2/3 mx-auto bg-amber-500/10" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-20 bg-amber-500/10" />
            <Skeleton className="h-10 w-full bg-amber-500/10" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-24 bg-amber-500/10" />
            <Skeleton className="h-10 w-full bg-amber-500/10" />
          </div>
          <Skeleton className="h-10 w-full bg-amber-500/20" />
          <Skeleton className="h-4 w-48 mx-auto bg-amber-500/10" />
        </CardContent>
      </Card>
    </div>
  );
}

export function RegisterFormSkeleton() {
  return (
    <div className="w-full max-w-md">
      <Card className="border-amber-500/20 bg-gradient-to-br from-slate-900/95 via-zinc-900/95 to-slate-900/95 backdrop-blur-xl shadow-2xl">
        <CardHeader className="space-y-3">
          <Skeleton className="h-8 w-3/4 mx-auto bg-amber-500/10" />
          <Skeleton className="h-4 w-2/3 mx-auto bg-amber-500/10" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-20 bg-amber-500/10" />
              <Skeleton className="h-10 w-full bg-amber-500/10" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-20 bg-amber-500/10" />
              <Skeleton className="h-10 w-full bg-amber-500/10" />
            </div>
          </div>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-24 bg-amber-500/10" />
              <Skeleton className="h-10 w-full bg-amber-500/10" />
            </div>
          ))}
          <Skeleton className="h-10 w-full bg-amber-500/20" />
          <Skeleton className="h-4 w-48 mx-auto bg-amber-500/10" />
        </CardContent>
      </Card>
    </div>
  );
}

