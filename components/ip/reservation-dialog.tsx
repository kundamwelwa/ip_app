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
  Shield, 
  AlertTriangle, 
  CheckCircle,
  Loader2,
  X,
  Calendar,
  Clock
} from "lucide-react";

interface ReservationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  ipAddress: string;
  onConfirm: (data: ReservationFormData) => void;
}

export interface ReservationFormData {
  reason: string;
  reservedBy: string;
  notes: string;
  duration?: string;
}

const reservationReasons = [
  { value: "new_equipment", label: "New Equipment" },
  { value: "maintenance", label: "Maintenance" },
  { value: "expansion", label: "Network Expansion" },
  { value: "backup", label: "Backup/Redundancy" },
  { value: "testing", label: "Testing/Development" },
  { value: "other", label: "Other" },
];

const durationOptions = [
  { value: "1_hour", label: "1 Hour" },
  { value: "4_hours", label: "4 Hours" },
  { value: "1_day", label: "1 Day" },
  { value: "1_week", label: "1 Week" },
  { value: "1_month", label: "1 Month" },
  { value: "indefinite", label: "Indefinite" },
];

export function ReservationDialog({ isOpen, onClose, ipAddress, onConfirm }: ReservationDialogProps) {
  const [formData, setFormData] = useState<ReservationFormData>({
    reason: "",
    reservedBy: "",
    notes: "",
    duration: "1_day",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<ReservationFormData>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<ReservationFormData> = {};
    
    if (!formData.reason) {
      newErrors.reason = "Reason is required";
    }
    
    if (!formData.reservedBy.trim()) {
      newErrors.reservedBy = "Reserved by is required";
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
      reason: "",
      reservedBy: "",
      notes: "",
      duration: "1_day",
    });
    setErrors({});
    setIsSubmitting(false);
    onClose();
  };

  const handleFieldChange = (field: keyof ReservationFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const getReasonLabel = (value: string) => {
    return reservationReasons.find(r => r.value === value)?.label || value;
  };

  const getDurationLabel = (value: string) => {
    return durationOptions.find(d => d.value === value)?.label || value;
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-primary" />
            <span>Reserve IP Address</span>
          </DialogTitle>
          <DialogDescription>
            Reserve <Badge variant="outline" className="mx-1">{ipAddress}</Badge> for future use
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto space-y-6 pr-2">
          {/* Reservation Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Reservation Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="reserve-reason" className="text-sm font-medium text-foreground">
                  Reason for Reservation *
                </Label>
                <Select
                  value={formData.reason}
                  onValueChange={(value) => handleFieldChange("reason", value)}
                >
                  <SelectTrigger className={`h-10 ${errors.reason ? "border-red-500 focus:border-red-500" : ""}`}>
                    <SelectValue placeholder="Select reason" />
                  </SelectTrigger>
                  <SelectContent>
                    {reservationReasons.map((reason) => (
                      <SelectItem key={reason.value} value={reason.value}>
                        {reason.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.reason && (
                  <p className="text-sm text-red-500 mt-1 flex items-center">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    {errors.reason}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="reserve-by" className="text-sm font-medium text-foreground">
                  Reserved By *
                </Label>
                <Input
                  id="reserve-by"
                  value={formData.reservedBy}
                  onChange={(e) => handleFieldChange("reservedBy", e.target.value)}
                  placeholder="Your name"
                  className={`h-10 ${errors.reservedBy ? "border-red-500 focus:border-red-500" : ""}`}
                />
                {errors.reservedBy && (
                  <p className="text-sm text-red-500 mt-1 flex items-center">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    {errors.reservedBy}
                  </p>
                )}
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Duration & Notes</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="reserve-duration" className="text-sm font-medium text-foreground">
                  Reservation Duration
                </Label>
                <Select
                  value={formData.duration}
                  onValueChange={(value) => handleFieldChange("duration", value)}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Select duration" />
                  </SelectTrigger>
                  <SelectContent>
                    {durationOptions.map((duration) => (
                      <SelectItem key={duration.value} value={duration.value}>
                        {duration.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  Auto-expires after selected duration
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="reserve-notes" className="text-sm font-medium text-foreground">
                  Notes
                </Label>
                <Textarea
                  id="reserve-notes"
                  value={formData.notes}
                  onChange={(e) => handleFieldChange("notes", e.target.value)}
                  placeholder="Additional notes about this reservation..."
                  rows={4}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  Optional: Add any additional information about this reservation
                </p>
              </div>
            </div>
          </div>
          
          {/* Reservation Summary */}
          <div className="p-6 bg-muted/30 border border-border rounded-lg">
            <h4 className="font-semibold text-foreground mb-4 flex items-center">
              <Calendar className="h-4 w-4 mr-2 text-primary" />
              Reservation Summary
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
                  <span className="text-muted-foreground font-medium">Reason:</span>
                  <span className="font-medium text-foreground">
                    {getReasonLabel(formData.reason) || "Not specified"}
                  </span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground font-medium">Reserved By:</span>
                  <span className="font-medium text-foreground">
                    {formData.reservedBy || "Not specified"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground font-medium">Duration:</span>
                  <span className="font-medium text-foreground">
                    {getDurationLabel(formData.duration || "1_day")}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Warning Message */}
          <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <span className="text-sm text-yellow-700 dark:text-yellow-300">
                <strong>Note:</strong> Reserved IP addresses cannot be assigned to equipment until the reservation is removed.
              </span>
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
                Reserving...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Reserve IP Address
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
