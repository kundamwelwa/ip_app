"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Plus } from "lucide-react";

interface IPAddressTagInputProps {
  ipAddresses: string[];
  onChange: (ipAddresses: string[]) => void;
}

export function IPAddressTagInput({ ipAddresses, onChange }: IPAddressTagInputProps) {
  const [inputValue, setInputValue] = useState("");
  const [error, setError] = useState("");

  const validateIP = (ip: string): boolean => {
    const ipPattern = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipPattern.test(ip)) return false;
    
    const parts = ip.split('.');
    return parts.every(part => {
      const num = parseInt(part);
      return num >= 0 && num <= 255;
    });
  };

  const handleAdd = () => {
    const trimmedValue = inputValue.trim();
    
    if (!trimmedValue) {
      setError("Please enter an IP address");
      return;
    }

    if (!validateIP(trimmedValue)) {
      setError("Please enter a valid IP address (e.g., 192.168.1.100)");
      return;
    }

    if (ipAddresses.includes(trimmedValue)) {
      setError("This IP address has already been added");
      return;
    }

    onChange([...ipAddresses, trimmedValue]);
    setInputValue("");
    setError("");
  };

  const handleRemove = (index: number) => {
    onChange(ipAddresses.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="flex-1">
          <Input
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              setError("");
            }}
            onKeyDown={handleKeyDown}
            placeholder="e.g., 192.168.1.100"
            className={`font-mono ${error ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
          />
          {error && (
            <p className="text-xs text-red-500 mt-1">{error}</p>
          )}
        </div>
        <Button 
          type="button" 
          onClick={handleAdd}
          size="default"
          className="px-4"
        >
          <Plus className="h-4 w-4 mr-1" />
          Add
        </Button>
      </div>

      {ipAddresses.length > 0 && (
        <div className="flex flex-wrap gap-2 p-3 bg-muted/30 rounded-md border border-border min-h-[60px]">
          {ipAddresses.map((ip, index) => (
            <Badge
              key={index}
              variant="secondary"
              className="h-8 px-3 font-mono text-sm flex items-center gap-2 bg-primary/10 hover:bg-primary/20 transition-colors"
            >
              <span>{ip}</span>
              <button
                type="button"
                onClick={() => handleRemove(index)}
                className="ml-1 hover:bg-destructive/20 rounded-full p-0.5 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {ipAddresses.length === 0 && (
        <div className="p-3 bg-muted/20 rounded-md border border-dashed border-border/50 text-center">
          <p className="text-sm text-muted-foreground">No IP addresses added yet. Add at least one IP address.</p>
        </div>
      )}
      
      {ipAddresses.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {ipAddresses.length} IP {ipAddresses.length === 1 ? 'address' : 'addresses'} added
        </p>
      )}
    </div>
  );
}

