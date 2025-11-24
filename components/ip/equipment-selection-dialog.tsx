"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Search, 
  CheckCircle, 
  XCircle,
  Activity,
  MapPin,
  User,
  Loader2,
  AlertTriangle,
  Link,
  X,
  Truck
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Equipment {
  id: string;
  name: string;
  type: string;
  model: string | null;
  manufacturer: string | null;
  serialNumber: string | null;
  status: "ONLINE" | "OFFLINE" | "MAINTENANCE" | "UNKNOWN";
  location: string | null;
  operator: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface EquipmentSelectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  ipAddress: string;
  onConfirm: (equipmentId: string, equipmentName: string) => void;
}

export function EquipmentSelectionDialog({ 
  isOpen, 
  onClose, 
  ipAddress, 
  onConfirm 
}: EquipmentSelectionDialogProps) {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [filteredEquipment, setFilteredEquipment] = useState<Equipment[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch equipment data
  useEffect(() => {
    if (isOpen) {
      fetchEquipment();
    }
  }, [isOpen]);

  // Filter equipment based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredEquipment(equipment);
    } else {
      const filtered = equipment.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.serialNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.operator?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredEquipment(filtered);
    }
  }, [searchTerm, equipment]);

  const fetchEquipment = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch("/api/equipment");
      if (!response.ok) {
        throw new Error("Failed to fetch equipment");
      }
      
      const data = await response.json();
      setEquipment(data.equipment || []);
    } catch (error) {
      console.error("Error fetching equipment:", error);
      setError("Failed to load equipment data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectEquipment = (equipment: Equipment) => {
    setSelectedEquipment(equipment);
  };

  const handleConfirm = () => {
    if (selectedEquipment) {
      onConfirm(selectedEquipment.id, selectedEquipment.name);
      handleClose();
    }
  };

  const handleClose = () => {
    setSelectedEquipment(null);
    setSearchTerm("");
    setError(null);
    onClose();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ONLINE":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "OFFLINE":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "MAINTENANCE":
        return <Activity className="h-4 w-4 text-yellow-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      ONLINE: "default",
      OFFLINE: "destructive",
      MAINTENANCE: "secondary",
      UNKNOWN: "outline",
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || "outline"}>
        {status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()}
      </Badge>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link className="h-5 w-5 text-primary" />
            Assign IP Address
          </DialogTitle>
          <DialogDescription>
            Assign <Badge variant="outline" className="mx-1 font-mono text-xs">{ipAddress}</Badge> to equipment
          </DialogDescription>
        </DialogHeader>
        
        <TooltipProvider>
          <div className="flex-1 overflow-y-auto dialog-scroll space-y-6 py-4" style={{ paddingRight: '4px' }}>
            {/* Search Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b">
                <Truck className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-base">Select Equipment</h3>
              </div>
              
              <div className="space-y-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Label htmlFor="equipment-search" className="cursor-help">
                      Search Equipment
                    </Label>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Search by name, type, serial number, location, or operator</p>
                  </TooltipContent>
                </Tooltip>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="equipment-search"
                    placeholder="Search equipment..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

          {/* Error State */}
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <span className="text-sm text-red-700 dark:text-red-300">{error}</span>
              </div>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span>Loading equipment...</span>
            </div>
          )}

          {/* Equipment List */}
          {!isLoading && !error && (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2">
                <p className="text-sm font-medium text-muted-foreground">
                  {filteredEquipment.length} {filteredEquipment.length === 1 ? 'equipment' : 'equipments'} available
                </p>
                {selectedEquipment && (
                  <Badge variant="default" className="bg-green-600">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Selected
                  </Badge>
                )}
              </div>
              
              <div className="space-y-3">
                {filteredEquipment.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg bg-muted/20">
                    <Truck className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p className="font-medium">{searchTerm ? "No equipment found" : "No equipment available"}</p>
                    <p className="text-sm mt-1">{searchTerm && "Try adjusting your search"}</p>
                  </div>
                ) : (
                  filteredEquipment.map((item) => (
                    <Card 
                      key={item.id}
                      className={`cursor-pointer transition-all duration-200 ${
                        selectedEquipment?.id === item.id 
                          ? 'ring-2 ring-primary bg-primary/5 border-primary shadow-md' 
                          : 'hover:bg-muted/50 hover:shadow-sm hover:border-primary/30'
                      }`}
                      onClick={() => handleSelectEquipment(item)}
                    >
                      <CardContent className="p-5 pl-6">
                        <div className="flex items-start gap-4">
                          {/* Selection Indicator */}
                          <div className="flex-shrink-0 mt-1">
                            {selectedEquipment?.id === item.id ? (
                              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                                <CheckCircle className="h-3 w-3 text-primary-foreground" />
                              </div>
                            ) : (
                              <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30"></div>
                            )}
                          </div>

                          {/* Equipment Info */}
                          <div className="flex-1 min-w-0 space-y-3">
                            {/* Header */}
                            <div>
                              <h4 className="font-semibold text-base mb-1.5 truncate">{item.name}</h4>
                              <Badge variant="outline" className="text-xs">{item.type}</Badge>
                            </div>
                            
                            {/* Details Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm">
                              {item.model && (
                                <div className="flex items-center gap-2">
                                  <span className="text-muted-foreground min-w-[60px]">Model:</span>
                                  <span className="font-medium truncate">{item.model}</span>
                                </div>
                              )}
                              {item.serialNumber && (
                                <div className="flex items-center gap-2">
                                  <span className="text-muted-foreground min-w-[60px]">Serial:</span>
                                  <span className="font-mono text-xs truncate">{item.serialNumber}</span>
                                </div>
                              )}
                              {item.location && (
                                <div className="flex items-center gap-2">
                                  <MapPin className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                                  <span className="truncate">{item.location}</span>
                                </div>
                              )}
                              {item.operator && (
                                <div className="flex items-center gap-2">
                                  <User className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                                  <span className="truncate">{item.operator}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          )}
          </div>
        </TooltipProvider>
        
        <DialogFooter className="gap-2 pt-4 border-t mt-auto">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleConfirm} 
            disabled={!selectedEquipment}
            className={!selectedEquipment ? 'opacity-50 cursor-not-allowed' : ''}
          >
            {selectedEquipment ? (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Assign to {selectedEquipment.name}
              </>
            ) : (
              <>
                <Link className="h-4 w-4 mr-2" />
                Select Equipment First
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

