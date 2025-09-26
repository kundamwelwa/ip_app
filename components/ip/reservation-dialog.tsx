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
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-primary" />
            <span>Reserve IP Address</span>
          </DialogTitle>
          <DialogDescription>
            Reserve <Badge variant="outline" className="mx-1">{ipAddress}</Badge> for future use
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Reservation Details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="reserve-reason">Reason for Reservation *</Label>
              <Select
                value={formData.reason}
                onValueChange={(value) => handleFieldChange("reason", value)}
              >
                <SelectTrigger className={errors.reason ? "border-red-500" : ""}>
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
                <p className="text-sm text-red-500 mt-1">{errors.reason}</p>
              )}
            </div>
            <div>
              <Label htmlFor="reserve-by">Reserved By *</Label>
              <Input
                id="reserve-by"
                value={formData.reservedBy}
                onChange={(e) => handleFieldChange("reservedBy", e.target.value)}
                placeholder="Your name"
                className={errors.reservedBy ? "border-red-500" : ""}
              />
              {errors.reservedBy && (
                <p className="text-sm text-red-500 mt-1">{errors.reservedBy}</p>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="reserve-duration">Reservation Duration</Label>
              <Select
                value={formData.duration}
                onValueChange={(value) => handleFieldChange("duration", value)}
              >
                <SelectTrigger>
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
            </div>
            <div className="flex items-end">
              <div className="text-sm text-muted-foreground">
                <Clock className="h-4 w-4 inline mr-1" />
                Auto-expires after selected duration
              </div>
            </div>
          </div>
          
          <div>
            <Label htmlFor="reserve-notes">Notes</Label>
            <Textarea
              id="reserve-notes"
              value={formData.notes}
              onChange={(e) => handleFieldChange("notes", e.target.value)}
              placeholder="Additional notes about this reservation"
              rows={3}
            />
          </div>
          
          {/* Reservation Summary */}
          <div className="p-4 bg-muted/50 rounded-lg">
            <h4 className="font-medium mb-2 flex items-center space-x-2">
              <Calendar className="h-4 w-4" />
              <span>Reservation Summary</span>
            </h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">IP Address:</span>
                <span className="font-medium">{ipAddress}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Reason:</span>
                <span className="font-medium">
                  {getReasonLabel(formData.reason) || "Not specified"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Reserved By:</span>
                <span className="font-medium">
                  {formData.reservedBy || "Not specified"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Duration:</span>
                <span className="font-medium">
                  {getDurationLabel(formData.duration || "1_day")}
                </span>
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
        
        <DialogFooter>
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
