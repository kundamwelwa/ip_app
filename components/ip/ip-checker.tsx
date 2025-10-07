"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
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
import { getTimeAgo, calculateUptime, formatDateForDisplay } from "@/lib/time-utils";
import { getSignalStrengthColor, getUptimeColor } from "@/lib/real-time-data";

interface IPCheckResult {
  ip: string;
  status: "assigned" | "available" | "reserved";
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
    meshStrength: number;
    responseTime?: number;
    notes: string;
    // Real-time data
    timeAgo: string;
    lastSeenFormatted: string;
    isOnline: boolean;
  };
  subnet: string;
  gateway: string;
  dns: string[];
  createdAt: Date;
  lastModified: Date;
  isReserved?: boolean;
  notes?: string;
}

interface IPCheckerProps {
  onAssignIP: (ip: string) => void;
  onReserveIP: (ip: string) => void;
  onViewDetails: (ip: string) => void;
  onUnassign: (ip: string) => void;
  onRefresh: (ip: string) => void;
  onAssignmentComplete?: () => void;
}

export function IPChecker({ 
  onAssignIP, 
  onReserveIP, 
  onViewDetails, 
  onUnassign, 
  onRefresh,
  onAssignmentComplete
}: IPCheckerProps) {
  const { data: session } = useSession();
  const [ipAddress, setIpAddress] = useState("");
  const [isCheckingIP, setIsCheckingIP] = useState(false);
  const [ipCheckResult, setIpCheckResult] = useState<IPCheckResult | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  // Listen for assignment completion and refresh if we have a result
  useEffect(() => {
    if (onAssignmentComplete && ipCheckResult) {
      // Re-check the IP address to get updated status
      handleCheckIP();
    }
  }, [onAssignmentComplete]);

  // Add a callback to notify parent when assignment is completed
  const handleAssignmentComplete = () => {
    if (onAssignmentComplete) {
      onAssignmentComplete();
    }
  };

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
    
    try {
      // Check IP assignment status
      const response = await fetch(`/api/ip-addresses/check?ip=${encodeURIComponent(ipAddress)}`);
      if (!response.ok) {
        throw new Error("Failed to check IP address");
      }
      
      const data = await response.json();
      
      if (data.status === "assigned" && data.assignment) {
        // Get real-time equipment status
        let realTimeData = null;
        try {
          const realTimeResponse = await fetch(`/api/equipment/communication?equipmentId=${data.assignment.equipment.id}`);
          if (realTimeResponse.ok) {
            const realTimeResult = await realTimeResponse.json();
            if (realTimeResult.success) {
              realTimeData = realTimeResult.result;
            }
          }
        } catch (error) {
          console.warn('Failed to fetch real-time data:', error);
        }

        const lastSeen = realTimeData ? realTimeData.lastSeen : new Date(data.assignment.assignedAt);
        const isOnline = realTimeData ? realTimeData.isOnline : data.assignment.equipment.status === 'ONLINE';
        const responseTime = realTimeData?.responseTime;
        const uptime = calculateUptime(lastSeen);
        const timeAgo = getTimeAgo(lastSeen);
        
        // Calculate signal strength from real-time data or mesh strength
        const signalStrength = realTimeData ? 
          Math.max(0, 100 - (responseTime || 0) / 10) : 
          data.assignment.equipment.meshStrength || 85;

        setIpCheckResult({
          ip: ipAddress,
          status: "assigned",
          equipment: {
            id: data.assignment.equipment.id,
            name: data.assignment.equipment.name,
            type: data.assignment.equipment.type,
            status: isOnline ? "online" : "offline",
            location: data.assignment.equipment.location || "Unknown",
            operator: data.assignment.equipment.operator,
            lastSeen: lastSeen,
            uptime: uptime,
            signalStrength: Math.min(100, Math.max(0, signalStrength)),
            meshStrength: data.assignment.equipment.meshStrength || 0,
            responseTime: responseTime,
            notes: session?.user?.name === data.assignment.assignedBy ? "Assigned by you" : `Assigned by ${data.assignment.assignedBy}`,
            // Real-time data
            timeAgo: timeAgo.fullText,
            lastSeenFormatted: formatDateForDisplay(lastSeen, 'medium'),
            isOnline: isOnline
          },
          subnet: data.subnet || "192.168.1.0/24",
          gateway: data.gateway || "192.168.1.1",
          dns: data.dns || ["8.8.8.8", "8.8.4.4"],
          createdAt: new Date(data.assignment.assignedAt),
          lastModified: new Date(data.assignment.assignedAt)
        });
      } else {
        setIpCheckResult({
          ip: ipAddress,
          status: data.status || "available",
          subnet: data.subnet || "192.168.1.0/24",
          gateway: data.gateway || "192.168.1.1",
          dns: data.dns || ["8.8.8.8", "8.8.4.4"],
          createdAt: new Date(),
          lastModified: new Date(),
          isReserved: data.isReserved || false,
          notes: data.notes
        });
      }
    } catch (error) {
      console.error('Error checking IP address:', error);
      setValidationError('Failed to check IP address. Please try again.');
    } finally {
      setIsCheckingIP(false);
    }
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
                <Badge variant={
                  ipCheckResult.status === "assigned" ? "destructive" : 
                  ipCheckResult.status === "reserved" ? "secondary" : 
                  "default"
                }>
                  {ipCheckResult.status === "assigned" ? "Assigned" : 
                   ipCheckResult.status === "reserved" ? "Reserved" : 
                   "Available"}
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
                {/* Equipment Assignment Header */}
                <div className="p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <AlertTriangle className="h-5 w-5 text-orange-600" />
                    <span className="font-medium text-orange-800 dark:text-orange-200">IP Address Assigned</span>
                  </div>
                  <p className="text-sm text-orange-700 dark:text-orange-300">
                    This IP address is currently assigned to equipment. Equipment details and network status are shown below.
                  </p>
                </div>

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
                      <div className="text-sm text-muted-foreground space-y-1">
                        <div><strong>ID:</strong> {ipCheckResult.equipment.id}</div>
                        <div><strong>Type:</strong> {ipCheckResult.equipment.type}</div>
                        <div><strong>Location:</strong> {ipCheckResult.equipment.location}</div>
                        <div><strong>Operator:</strong> {ipCheckResult.equipment.operator}</div>
                        {ipCheckResult.equipment.notes && (
                          <div><strong>Notes:</strong> {ipCheckResult.equipment.notes}</div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Real-time Network Status</Label>
                    <div className="p-3 bg-background border rounded-md space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Uptime</span>
                        <div className="flex items-center space-x-2">
                          <span className={`font-medium ${getUptimeColor(ipCheckResult.equipment.uptime)}`}>
                            {ipCheckResult.equipment.uptime}%
                          </span>
                          {ipCheckResult.equipment.isOnline && (
                            <Badge variant="outline" className="text-xs">
                              Live
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Signal Strength</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-16 bg-muted rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${
                                ipCheckResult.equipment.signalStrength > 80 
                                  ? 'bg-green-500' 
                                  : ipCheckResult.equipment.signalStrength > 60 
                                    ? 'bg-yellow-500' 
                                    : ipCheckResult.equipment.signalStrength > 40
                                      ? 'bg-orange-500'
                                    : 'bg-red-500'
                              }`}
                              style={{ width: `${ipCheckResult.equipment.signalStrength}%` }}
                            />
                          </div>
                          <span className={`text-sm font-medium ${getSignalStrengthColor(ipCheckResult.equipment.signalStrength)}`}>
                            {ipCheckResult.equipment.signalStrength}%
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Mesh Strength</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-16 bg-muted rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${
                                ipCheckResult.equipment.meshStrength > 80 
                                  ? 'bg-blue-500' 
                                  : ipCheckResult.equipment.meshStrength > 60 
                                    ? 'bg-yellow-500' 
                                    : 'bg-red-500'
                              }`}
                              style={{ width: `${ipCheckResult.equipment.meshStrength}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium">{ipCheckResult.equipment.meshStrength}%</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Response Time</span>
                        <span className="text-sm font-medium">
                          {ipCheckResult.equipment.responseTime ? `${ipCheckResult.equipment.responseTime}ms` : 'N/A'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Last Seen</span>
                        <div className="text-right">
                          <div className="text-sm font-medium">{ipCheckResult.equipment.lastSeenFormatted}</div>
                          <div className={`text-xs ${ipCheckResult.equipment.isOnline ? 'text-green-600' : 'text-red-600'}`}>
                            {ipCheckResult.equipment.timeAgo}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Status</span>
                        <div className="flex items-center space-x-2">
                        <span className={`text-sm font-medium ${
                            ipCheckResult.equipment.isOnline 
                            ? 'text-green-600' 
                            : 'text-red-600'
                        }`}>
                            {ipCheckResult.equipment.isOnline ? '🟢 Online' : '🔴 Offline'}
                        </span>
                          {ipCheckResult.equipment.isOnline && (
                            <Badge variant="outline" className="text-xs">
                              Real-time
                            </Badge>
                          )}
                        </div>
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
            ) : ipCheckResult.status === "reserved" ? (
              <div className="space-y-4">
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <ShieldIcon className="h-5 w-5 text-yellow-600" />
                    <span className="font-medium text-yellow-800 dark:text-yellow-200">IP Address Reserved</span>
                  </div>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    This IP address is reserved and cannot be assigned to equipment.
                    {ipCheckResult.notes && ` Reason: ${ipCheckResult.notes}`}
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
                    <Label className="text-sm font-medium">Reservation Details</Label>
                    <div className="p-3 bg-background border rounded-md space-y-1 text-sm">
                      <div><strong>Status:</strong> Reserved</div>
                      <div><strong>Notes:</strong> {ipCheckResult.notes || "No additional notes"}</div>
                    </div>
                  </div>
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
                      <Button onClick={() => {
                        onAssignIP(ipCheckResult.ip);
                        handleAssignmentComplete();
                      }} className="w-full">
                        <Link className="h-4 w-4 mr-2" />
                        Assign to Equipment
                      </Button>
                      <Button onClick={() => {
                        onReserveIP(ipCheckResult.ip);
                        handleAssignmentComplete();
                      }} variant="outline" className="w-full">
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
