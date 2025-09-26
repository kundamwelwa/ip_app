"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { 
  Search, 
  CheckCircle, 
  XCircle,
  Activity,
  Eye,
  Unlink,
  RefreshCw,
  Loader2,
  AlertTriangle,
  Shield as ShieldIcon,
  Link,
  X,
  Info
} from "lucide-react";
import { validateIPAddress, isPrivateIP, getIPTypeDescription } from "@/lib/ip-validation";

interface IPCheckResult {
  ip: string;
  status: "assigned" | "available";
  equipment?: {
    id: string;
    name: string;
    type: string;
    status: "online" | "offline";
    location: string;
    operator: string;
    lastSeen: Date;
    uptime: number;
    signalStrength: number;
    notes: string;
  };
  subnet: string;
  gateway: string;
  dns: string[];
  createdAt: Date;
  lastModified: Date;
}

interface IPCheckerProps {
  onAssignIP: (ip: string) => void;
  onReserveIP: (ip: string) => void;
  onViewDetails: (ip: string) => void;
  onUnassign: (ip: string) => void;
  onRefresh: (ip: string) => void;
}

export function IPChecker({ 
  onAssignIP, 
  onReserveIP, 
  onViewDetails, 
  onUnassign, 
  onRefresh 
}: IPCheckerProps) {
  const [ipAddress, setIpAddress] = useState("");
  const [isCheckingIP, setIsCheckingIP] = useState(false);
  const [ipCheckResult, setIpCheckResult] = useState<IPCheckResult | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  const handleIPChange = (value: string) => {
    setIpAddress(value);
    setValidationError(null);
    
    // Clear result when IP changes
    if (ipCheckResult) {
      setIpCheckResult(null);
    }
  };

  const handleValidateIP = async (ip: string) => {
    setIsValidating(true);
    
    // Simulate validation delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const validation = validateIPAddress(ip);
    
    if (!validation.isValid) {
      setValidationError(validation.error || 'Invalid IP address');
      setIsValidating(false);
      return false;
    }
    
    setIsValidating(false);
    return true;
  };

  const handleCheckIP = async () => {
    if (!ipAddress.trim()) {
      setValidationError('Please enter an IP address');
      return;
    }

    const isValid = await handleValidateIP(ipAddress);
    if (!isValid) return;
    
    setIsCheckingIP(true);
    setValidationError(null);
    
    // Simulate API call with loading animation
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Mock IP check result
    const mockResult: IPCheckResult = {
      ip: ipAddress,
      status: Math.random() > 0.5 ? "assigned" : "available",
      equipment: Math.random() > 0.5 ? {
        id: "EQ001",
        name: "Mining Truck 001",
        type: "Truck",
        status: Math.random() > 0.5 ? "online" : "offline",
        location: "Pit A",
        operator: "John Smith",
        lastSeen: new Date(),
        uptime: 99.5,
        signalStrength: 85,
        notes: "Primary haul truck"
      } : undefined,
      subnet: "192.168.1.0/24",
      gateway: "192.168.1.1",
      dns: ["8.8.8.8", "8.8.4.4"],
      createdAt: new Date("2024-01-01"),
      lastModified: new Date("2024-01-20"),
    };
    
    setIpCheckResult(mockResult);
    setIsCheckingIP(false);
  };

  const handleClear = () => {
    setIpAddress("");
    setIpCheckResult(null);
    setValidationError(null);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "online":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "offline":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      online: "default",
      offline: "destructive",
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || "outline"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  return (
    <Card className="border-2 border-dashed border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Search className="h-5 w-5 text-primary" />
          <span>IP Address Checker</span>
        </CardTitle>
        <CardDescription>
          Check if an IP address is assigned to equipment and view detailed information
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <Label htmlFor="ip-check">Enter IP Address</Label>
            <div className="flex items-center space-x-2 mt-2">
              <Input
                id="ip-check"
                placeholder="192.168.1.100"
                value={ipAddress}
                onChange={(e) => handleIPChange(e.target.value)}
                className={`flex-1 ${validationError ? 'border-red-500 focus:border-red-500' : ''}`}
                disabled={isCheckingIP}
              />
              <Button 
                onClick={handleCheckIP} 
                disabled={!ipAddress.trim() || isCheckingIP || isValidating}
                className="min-w-[120px]"
              >
                {isCheckingIP ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Checking...
                  </>
                ) : isValidating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Validating...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Check IP
                  </>
                )}
              </Button>
              <Button 
                variant="outline" 
                onClick={handleClear}
                disabled={isCheckingIP}
                className="min-w-[80px]"
              >
                <X className="h-4 w-4 mr-2" />
                Clear
              </Button>
            </div>
            
            {/* Validation Error */}
            {validationError && (
              <div className="mt-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <span className="text-sm text-red-700 dark:text-red-300">{validationError}</span>
                </div>
              </div>
            )}

            {/* IP Type Info */}
            {ipAddress && !validationError && !isValidating && (
              <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Info className="h-4 w-4 text-blue-600" />
                  <span className="text-sm text-blue-700 dark:text-blue-300">
                    {validateIPAddress(ipAddress).isValid && (
                      <>
                        Valid {validateIPAddress(ipAddress).type} address
                        {isPrivateIP(ipAddress) && " (Private IP)"}
                      </>
                    )}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* IP Check Results */}
        {ipCheckResult && (
          <div className="mt-6 p-4 border rounded-lg bg-muted/50">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">IP Address Status</h3>
              <div className="flex items-center space-x-2">
                <Badge variant={ipCheckResult.status === "assigned" ? "destructive" : "default"}>
                  {ipCheckResult.status === "assigned" ? "Assigned" : "Available"}
                </Badge>
                {isPrivateIP(ipCheckResult.ip) && (
                  <Badge variant="outline" className="text-xs">
                    Private IP
                  </Badge>
                )}
              </div>
            </div>

            {ipCheckResult.status === "assigned" && ipCheckResult.equipment ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Equipment Information</Label>
                    <div className="p-3 bg-background border rounded-md space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{ipCheckResult.equipment.name}</span>
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(ipCheckResult.equipment.status)}
                          {getStatusBadge(ipCheckResult.equipment.status)}
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <div>ID: {ipCheckResult.equipment.id}</div>
                        <div>Type: {ipCheckResult.equipment.type}</div>
                        <div>Location: {ipCheckResult.equipment.location}</div>
                        <div>Operator: {ipCheckResult.equipment.operator}</div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Network Status</Label>
                    <div className="p-3 bg-background border rounded-md space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Uptime</span>
                        <span className="font-medium">{ipCheckResult.equipment.uptime}%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Signal Strength</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-16 bg-muted rounded-full h-2">
                            <div 
                              className="bg-green-500 h-2 rounded-full" 
                              style={{ width: `${ipCheckResult.equipment.signalStrength}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium">{ipCheckResult.equipment.signalStrength}%</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Last Seen</span>
                        <span className="text-sm">{ipCheckResult.equipment.lastSeen.toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" onClick={() => onViewDetails(ipCheckResult.ip)}>
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => onUnassign(ipCheckResult.ip)}>
                    <Unlink className="h-4 w-4 mr-2" />
                    Unassign
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => onRefresh(ipCheckResult.ip)}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh Status
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="font-medium text-green-800 dark:text-green-200">IP Address Available</span>
                  </div>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    This IP address is not currently assigned to any equipment and is available for assignment.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Network Configuration</Label>
                    <div className="p-3 bg-background border rounded-md space-y-1 text-sm">
                      <div>Subnet: {ipCheckResult.subnet}</div>
                      <div>Gateway: {ipCheckResult.gateway}</div>
                      <div>DNS: {ipCheckResult.dns.join(", ")}</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Quick Actions</Label>
                    <div className="space-y-2">
                      <Button onClick={() => onAssignIP(ipCheckResult.ip)} className="w-full">
                        <Link className="h-4 w-4 mr-2" />
                        Assign to Equipment
                      </Button>
                      <Button onClick={() => onReserveIP(ipCheckResult.ip)} variant="outline" className="w-full">
                        <ShieldIcon className="h-4 w-4 mr-2" />
                        Reserve IP Address
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
