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
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Link className="h-5 w-5 text-primary" />
            <span>Assign IP Address</span>
          </DialogTitle>
          <DialogDescription>
            Assign <Badge variant="outline" className="mx-1">{ipAddress}</Badge> to equipment
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Equipment Information */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="assign-equipment-id">Equipment ID *</Label>
              <Input
                id="assign-equipment-id"
                value={formData.equipmentId}
                onChange={(e) => handleFieldChange("equipmentId", e.target.value)}
                placeholder="EQ001"
                className={errors.equipmentId ? "border-red-500" : ""}
              />
              {errors.equipmentId && (
                <p className="text-sm text-red-500 mt-1">{errors.equipmentId}</p>
              )}
            </div>
            <div>
              <Label htmlFor="assign-equipment-name">Equipment Name *</Label>
              <Input
                id="assign-equipment-name"
                value={formData.equipmentName}
                onChange={(e) => handleFieldChange("equipmentName", e.target.value)}
                placeholder="Mining Truck 001"
                className={errors.equipmentName ? "border-red-500" : ""}
              />
              {errors.equipmentName && (
                <p className="text-sm text-red-500 mt-1">{errors.equipmentName}</p>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="assign-equipment-type">Equipment Type *</Label>
              <Select
                value={formData.equipmentType}
                onValueChange={(value) => handleFieldChange("equipmentType", value)}
              >
                <SelectTrigger className={errors.equipmentType ? "border-red-500" : ""}>
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
                <p className="text-sm text-red-500 mt-1">{errors.equipmentType}</p>
              )}
            </div>
            <div>
              <Label htmlFor="assign-location">Location *</Label>
              <Input
                id="assign-location"
                value={formData.location}
                onChange={(e) => handleFieldChange("location", e.target.value)}
                placeholder="Pit A"
                className={errors.location ? "border-red-500" : ""}
              />
              {errors.location && (
                <p className="text-sm text-red-500 mt-1">{errors.location}</p>
              )}
            </div>
          </div>
          
          <div>
            <Label htmlFor="assign-notes">Notes</Label>
            <Textarea
              id="assign-notes"
              value={formData.notes}
              onChange={(e) => handleFieldChange("notes", e.target.value)}
              placeholder="Additional notes about this assignment"
              rows={3}
            />
          </div>
          
          {/* Assignment Summary */}
          <div className="p-4 bg-muted/50 rounded-lg">
            <h4 className="font-medium mb-2">Assignment Summary</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">IP Address:</span>
                <span className="font-medium">{ipAddress}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Equipment:</span>
                <span className="font-medium">
                  {formData.equipmentName || "Not specified"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Type:</span>
                <span className="font-medium">
                  {formData.equipmentType || "Not specified"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Location:</span>
                <span className="font-medium">
                  {formData.location || "Not specified"}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <DialogFooter>
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
