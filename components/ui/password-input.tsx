"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  showStrength?: boolean;
  strength?: {
    score: number;
    feedback: string[];
    isValid: boolean;
  };
}

export function PasswordInput({ 
  className, 
  showStrength = false, 
  strength,
  ...props 
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="space-y-2">
      <div className="relative">
        <Input
          type={showPassword ? "text" : "password"}
          className={cn("pr-10", className)}
          {...props}
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
          onClick={() => setShowPassword(!showPassword)}
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4 text-muted-foreground" />
          ) : (
            <Eye className="h-4 w-4 text-muted-foreground" />
          )}
        </Button>
      </div>
      
      {showStrength && strength && (
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  strength.score === 0 ? "bg-red-500" :
                  strength.score === 1 ? "bg-red-500" :
                  strength.score === 2 ? "bg-orange-500" :
                  strength.score === 3 ? "bg-yellow-500" :
                  "bg-green-500"
                }`}
                style={{ width: `${(strength.score / 4) * 100}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground">
              {strength.score === 0 ? "Very Weak" :
               strength.score === 1 ? "Very Weak" :
               strength.score === 2 ? "Weak" :
               strength.score === 3 ? "Good" :
               "Strong"}
            </span>
          </div>
          
          {strength.feedback.length > 0 && (
            <div className="text-xs text-muted-foreground">
              <p className="mb-1">Password must contain:</p>
              <ul className="list-disc list-inside space-y-1">
                {strength.feedback.map((item, index) => (
                  <li key={index} className="text-red-500">{item}</li>
                ))}
              </ul>
            </div>
          )}
          
          {strength.isValid && (
            <p className="text-xs text-green-600">✓ Password meets all requirements</p>
          )}
        </div>
      )}
    </div>
  );
}
