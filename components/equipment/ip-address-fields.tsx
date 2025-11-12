"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Network, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { IPAddressInput } from "@/types/equipment";
import { isIPAddressFeatureEnabled } from "@/lib/feature-flags";

interface IPAddressFieldsProps {
  ipAddresses: IPAddressInput[];
  onChange: (ipAddresses: IPAddressInput[]) => void;
  onRemove?: (index: number) => void;
}

export function IPAddressFields({ ipAddresses, onChange, onRemove }: IPAddressFieldsProps) {
  const handleChange = (index: number, field: keyof IPAddressInput, value: string) => {
    const updated = [...ipAddresses];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      {ipAddresses.map((ip, index) => (
        <Card key={index} className="relative">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Network className="h-4 w-4 text-blue-600" />
                <CardTitle className="text-base">
                  IP Address {index + 1}
                  {ip.address && (
                    <Badge variant="outline" className="ml-2 font-mono text-xs">
                      {ip.address}
                    </Badge>
                  )}
                </CardTitle>
              </div>
              {onRemove && ipAddresses.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemove(index)}
                  className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor={`ip-address-${index}`}>
                IP Address <span className="text-red-500">*</span>
              </Label>
              <Input
                id={`ip-address-${index}`}
                value={ip.address}
                onChange={(e) => handleChange(index, "address", e.target.value)}
                placeholder="e.g., 192.168.1.100"
                className="font-mono"
              />
            </div>

            {isIPAddressFeatureEnabled("showSubnetField") && (
              <div className="space-y-2">
                <Label htmlFor={`subnet-${index}`}>
                  Subnet {isIPAddressFeatureEnabled("requireSubnet") && <span className="text-red-500">*</span>}
                </Label>
                <Input
                  id={`subnet-${index}`}
                  value={ip.subnet}
                  onChange={(e) => handleChange(index, "subnet", e.target.value)}
                  placeholder="e.g., 192.168.1.0/24"
                  className="font-mono"
                />
              </div>
            )}

            {(isIPAddressFeatureEnabled("showGatewayField") || isIPAddressFeatureEnabled("showDNSField")) && (
              <div className="grid grid-cols-2 gap-4">
                {isIPAddressFeatureEnabled("showGatewayField") && (
                  <div className="space-y-2">
                    <Label htmlFor={`gateway-${index}`}>
                      Gateway {isIPAddressFeatureEnabled("requireGateway") && <span className="text-red-500">*</span>}
                    </Label>
                    <Input
                      id={`gateway-${index}`}
                      value={ip.gateway}
                      onChange={(e) => handleChange(index, "gateway", e.target.value)}
                      placeholder="e.g., 192.168.1.1"
                      className="font-mono"
                    />
                  </div>
                )}
                {isIPAddressFeatureEnabled("showDNSField") && (
                  <div className="space-y-2">
                    <Label htmlFor={`dns-${index}`}>
                      DNS Servers {isIPAddressFeatureEnabled("requireDNS") && <span className="text-red-500">*</span>}
                    </Label>
                    <Input
                      id={`dns-${index}`}
                      value={ip.dns}
                      onChange={(e) => handleChange(index, "dns", e.target.value)}
                      placeholder="e.g., 8.8.8.8, 8.8.4.4"
                      className="font-mono"
                    />
                  </div>
                )}
              </div>
            )}

            {isIPAddressFeatureEnabled("showNotesField") && (
              <div className="space-y-2">
                <Label htmlFor={`ip-notes-${index}`}>Notes (Optional)</Label>
                <Textarea
                  id={`ip-notes-${index}`}
                  value={ip.notes}
                  onChange={(e) => handleChange(index, "notes", e.target.value)}
                  placeholder="e.g., Primary connection, Backup link, etc."
                  rows={2}
                />
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

