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
  X
} from "lucide-react";

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
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center space-x-2">
            <Link className="h-5 w-5 text-primary" />
            <span>Select Equipment for IP Assignment</span>
          </DialogTitle>
          <DialogDescription>
            Assign <Badge variant="outline" className="mx-1">{ipAddress}</Badge> to equipment
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto space-y-4">
          {/* Search */}
          <div className="space-y-2">
            <Label htmlFor="equipment-search">Search Equipment</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="equipment-search"
                placeholder="Search by name, type, serial number, location, or operator..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
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
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">
                  Available Equipment ({filteredEquipment.length})
                </h3>
                {selectedEquipment && (
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    Selected: {selectedEquipment.name}
                  </Badge>
                )}
              </div>
              
              <div className="grid gap-3 max-h-96 overflow-y-auto">
                {filteredEquipment.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {searchTerm ? "No equipment found matching your search" : "No equipment available"}
                  </div>
                ) : (
                  filteredEquipment.map((item) => (
                    <Card 
                      key={item.id}
                      className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                        selectedEquipment?.id === item.id 
                          ? 'ring-2 ring-primary bg-primary/5' 
                          : 'hover:bg-muted/50'
                      }`}
                      onClick={() => handleSelectEquipment(item)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">{item.name}</CardTitle>
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(item.status)}
                            {getStatusBadge(item.status)}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium">Type:</span>
                              <span className="text-muted-foreground">{item.type}</span>
                            </div>
                            {item.model && (
                              <div className="flex items-center space-x-2">
                                <span className="font-medium">Model:</span>
                                <span className="text-muted-foreground">{item.model}</span>
                              </div>
                            )}
                            {item.serialNumber && (
                              <div className="flex items-center space-x-2">
                                <span className="font-medium">Serial:</span>
                                <span className="text-muted-foreground">{item.serialNumber}</span>
                              </div>
                            )}
                          </div>
                          <div className="space-y-1">
                            {item.location && (
                              <div className="flex items-center space-x-2">
                                <MapPin className="h-3 w-3 text-muted-foreground" />
                                <span className="text-muted-foreground">{item.location}</span>
                              </div>
                            )}
                            {item.operator && (
                              <div className="flex items-center space-x-2">
                                <User className="h-3 w-3 text-muted-foreground" />
                                <span className="text-muted-foreground">{item.operator}</span>
                              </div>
                            )}
                            {item.manufacturer && (
                              <div className="flex items-center space-x-2">
                                <span className="font-medium">Manufacturer:</span>
                                <span className="text-muted-foreground">{item.manufacturer}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        {item.notes && (
                          <div className="mt-2 p-2 bg-muted/50 rounded text-xs text-muted-foreground">
                            {item.notes}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
        
        <DialogFooter className="flex-shrink-0 border-t pt-4">
          <Button variant="outline" onClick={handleClose}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button 
            onClick={handleConfirm} 
            disabled={!selectedEquipment}
            className="min-w-[140px]"
          >
            <Link className="h-4 w-4 mr-2" />
            Assign to {selectedEquipment?.name || "Equipment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
