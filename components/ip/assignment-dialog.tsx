"use client";

import { useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  Link, 
  AlertTriangle, 
  CheckCircle,
  Loader2,
  X
} from "lucide-react";

interface AssignmentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  ipAddress: string;
  onConfirm: (data: AssignmentFormData) => void;
}

export interface AssignmentFormData {
  equipmentId: string;
  equipmentName: string;
  equipmentType: string;
  location: string;
  notes: string;
}

const equipmentTypes = [
  { value: "Truck", label: "Truck" },
  { value: "Excavator", label: "Excavator" },
  { value: "Drill", label: "Drill" },
  { value: "Loader", label: "Loader" },
  { value: "Dozer", label: "Dozer" },
  { value: "Shovel", label: "Shovel" },
  { value: "Crusher", label: "Crusher" },
  { value: "Conveyor", label: "Conveyor" },
];

export function AssignmentDialog({ isOpen, onClose, ipAddress, onConfirm }: AssignmentDialogProps) {
  const [formData, setFormData] = useState<AssignmentFormData>({
    equipmentId: "",
    equipmentName: "",
    equipmentType: "",
    location: "",
    notes: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<AssignmentFormData>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<AssignmentFormData> = {};
    
    if (!formData.equipmentId.trim()) {
      newErrors.equipmentId = "Equipment ID is required";
    }
    
    if (!formData.equipmentName.trim()) {
      newErrors.equipmentName = "Equipment name is required";
    }
    
    if (!formData.equipmentType) {
      newErrors.equipmentType = "Equipment type is required";
    }
    
    if (!formData.location.trim()) {
      newErrors.location = "Location is required";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    onConfirm(formData);
    handleClose();
  };

  const handleClose = () => {
    setFormData({
      equipmentId: "",
      equipmentName: "",
      equipmentType: "",
      location: "",
      notes: "",
    });
    setErrors({});
    setIsSubmitting(false);
    onClose();
  };

  const handleFieldChange = (field: keyof AssignmentFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center space-x-2">
            <Link className="h-5 w-5 text-primary" />
            <span>Assign IP Address</span>
          </DialogTitle>
          <DialogDescription>
            Assign <Badge variant="outline" className="mx-1">{ipAddress}</Badge> to equipment
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto space-y-6 pr-2">
          {/* Equipment Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Equipment Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="assign-equipment-id" className="text-sm font-medium text-foreground">
                  Equipment ID *
                </Label>
                <Input
                  id="assign-equipment-id"
                  value={formData.equipmentId}
                  onChange={(e) => handleFieldChange("equipmentId", e.target.value)}
                  placeholder="EQ001"
                  className={`h-10 ${errors.equipmentId ? "border-red-500 focus:border-red-500" : ""}`}
                />
                {errors.equipmentId && (
                  <p className="text-sm text-red-500 mt-1 flex items-center">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    {errors.equipmentId}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="assign-equipment-name" className="text-sm font-medium text-foreground">
                  Equipment Name *
                </Label>
                <Input
                  id="assign-equipment-name"
                  value={formData.equipmentName}
                  onChange={(e) => handleFieldChange("equipmentName", e.target.value)}
                  placeholder="Mining Truck 001"
                  className={`h-10 ${errors.equipmentName ? "border-red-500 focus:border-red-500" : ""}`}
                />
                {errors.equipmentName && (
                  <p className="text-sm text-red-500 mt-1 flex items-center">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    {errors.equipmentName}
                  </p>
                )}
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Assignment Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="assign-equipment-type" className="text-sm font-medium text-foreground">
                  Equipment Type *
                </Label>
                <Select
                  value={formData.equipmentType}
                  onValueChange={(value) => handleFieldChange("equipmentType", value)}
                >
                  <SelectTrigger className={`h-10 ${errors.equipmentType ? "border-red-500 focus:border-red-500" : ""}`}>
                    <SelectValue placeholder="Select equipment type" />
                  </SelectTrigger>
                  <SelectContent>
                    {equipmentTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.equipmentType && (
                  <p className="text-sm text-red-500 mt-1 flex items-center">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    {errors.equipmentType}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="assign-location" className="text-sm font-medium text-foreground">
                  Location *
                </Label>
                <Input
                  id="assign-location"
                  value={formData.location}
                  onChange={(e) => handleFieldChange("location", e.target.value)}
                  placeholder="Pit A"
                  className={`h-10 ${errors.location ? "border-red-500 focus:border-red-500" : ""}`}
                />
                {errors.location && (
                  <p className="text-sm text-red-500 mt-1 flex items-center">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    {errors.location}
                  </p>
                )}
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Additional Information</h3>
            <div className="space-y-2">
              <Label htmlFor="assign-notes" className="text-sm font-medium text-foreground">
                Notes
              </Label>
              <Textarea
                id="assign-notes"
                value={formData.notes}
                onChange={(e) => handleFieldChange("notes", e.target.value)}
                placeholder="Additional notes about this assignment..."
                rows={4}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                Optional: Add any additional information about this IP assignment
              </p>
            </div>
          </div>
          
          {/* Assignment Summary */}
          <div className="p-6 bg-muted/30 border border-border rounded-lg">
            <h4 className="font-semibold text-foreground mb-4 flex items-center">
              <CheckCircle className="h-4 w-4 mr-2 text-primary" />
              Assignment Summary
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground font-medium">IP Address:</span>
                  <span className="font-semibold text-foreground bg-primary/10 px-2 py-1 rounded">
                    {ipAddress}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground font-medium">Equipment ID:</span>
                  <span className="font-medium text-foreground">
                    {formData.equipmentId || "Not specified"}
                  </span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground font-medium">Equipment Name:</span>
                  <span className="font-medium text-foreground">
                    {formData.equipmentName || "Not specified"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground font-medium">Type:</span>
                  <span className="font-medium text-foreground">
                    {formData.equipmentType || "Not specified"}
                  </span>
                </div>
              </div>
              <div className="flex justify-between items-center md:col-span-2">
                <span className="text-muted-foreground font-medium">Location:</span>
                <span className="font-medium text-foreground">
                  {formData.location || "Not specified"}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <DialogFooter className="flex-shrink-0 border-t pt-4">
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Assigning...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Assign IP Address
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
