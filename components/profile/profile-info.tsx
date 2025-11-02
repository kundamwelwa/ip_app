"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  User,
  Mail,
  Briefcase,
  Shield,
  Calendar,
  Edit,
  Save,
  X,
  Loader2,
  Camera,
  Clock,
} from "lucide-react";
import { isUserFeatureEnabled } from "@/lib/feature-flags";

interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  department: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  profilePicture?: string;
  phoneNumber?: string;
  _count?: {
    ipAssignments: number;
    auditLogs: number;
    reports: number;
  };
}

interface ProfileInfoProps {
  profile: UserProfile;
  onUpdate: (updates: Partial<UserProfile>) => Promise<void>;
  saving: boolean;
}

export function ProfileInfo({ profile, onUpdate, saving }: ProfileInfoProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: profile.firstName,
    lastName: profile.lastName,
    department: profile.department,
    phoneNumber: profile.phoneNumber || "",
  });

  useEffect(() => {
    setFormData({
      firstName: profile.firstName,
      lastName: profile.lastName,
      department: profile.department,
      phoneNumber: profile.phoneNumber || "",
    });
  }, [profile]);

  const handleSubmit = async () => {
    await onUpdate(formData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setFormData({
      firstName: profile.firstName,
      lastName: profile.lastName,
      department: profile.department,
      phoneNumber: profile.phoneNumber || "",
    });
    setIsEditing(false);
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  };

  const getRoleBadge = (role: string) => {
    const badges = {
      ADMIN: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border-2 border-purple-300 dark:border-purple-700",
      MANAGER: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-2 border-orange-300 dark:border-orange-700",
      TECHNICIAN: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400 border-2 border-cyan-300 dark:border-cyan-700",
    };
    return badges[role as keyof typeof badges] || badges.TECHNICIAN;
  };

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {/* Profile Card */}
      <Card className="md:col-span-1 border-2 border-blue-200 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="text-center">Profile Picture</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-4">
          <div className="relative">
            <Avatar className="h-32 w-32 border-4 border-blue-200 dark:border-blue-800">
              <AvatarImage src={profile.profilePicture} alt={`${profile.firstName} ${profile.lastName}`} />
              <AvatarFallback className="text-2xl font-bold">
                {getInitials(profile.firstName, profile.lastName)}
              </AvatarFallback>
            </Avatar>
            {isUserFeatureEnabled("allowProfilePictureUpload") && (
              <Button
                size="sm"
                className="absolute bottom-0 right-0 rounded-full h-10 w-10 p-0"
                variant="default"
              >
                <Camera className="h-4 w-4" />
              </Button>
            )}
          </div>

          <div className="text-center space-y-2">
            <h3 className="text-xl font-bold">
              {profile.firstName} {profile.lastName}
            </h3>
            <Badge className={`${getRoleBadge(profile.role)}`}>
              <Shield className="h-3 w-3 mr-1" />
              {profile.role}
            </Badge>
            <p className="text-sm text-muted-foreground">{profile.email}</p>
          </div>

          {profile._count && (
            <div className="w-full pt-4 border-t space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">IP Assignments:</span>
                <span className="font-semibold">{profile._count.ipAssignments}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Reports Generated:</span>
                <span className="font-semibold">{profile._count.reports}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Actions Logged:</span>
                <span className="font-semibold">{profile._count.auditLogs}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Personal Information Card */}
      <Card className="md:col-span-2 border-2 border-green-200 dark:border-green-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-green-600 dark:text-green-400" />
                Personal Information
              </CardTitle>
              <CardDescription>Your account details and information</CardDescription>
            </div>
            {!isEditing ? (
              <Button size="sm" onClick={() => setIsEditing(true)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={saving}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button size="sm" onClick={handleSubmit} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Name Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName" className="font-semibold flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                First Name
              </Label>
              {isEditing ? (
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  placeholder="John"
                />
              ) : (
                <p className="text-sm py-2 px-3 bg-muted rounded-md">{profile.firstName}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName" className="font-semibold flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                Last Name
              </Label>
              {isEditing ? (
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  placeholder="Doe"
                />
              ) : (
                <p className="text-sm py-2 px-3 bg-muted rounded-md">{profile.lastName}</p>
              )}
            </div>
          </div>

          {/* Email (Read-only) */}
          <div className="space-y-2">
            <Label className="font-semibold flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              Email Address
            </Label>
            <div className="flex items-center gap-2">
              <p className="text-sm py-2 px-3 bg-muted rounded-md flex-1">{profile.email}</p>
              <Badge variant="outline" className="text-xs">Read-only</Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Contact admin to change your email address
            </p>
          </div>

          {/* Department */}
          <div className="space-y-2">
            <Label htmlFor="department" className="font-semibold flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-muted-foreground" />
              Department
            </Label>
            {isEditing ? (
              <Input
                id="department"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                placeholder="Engineering"
              />
            ) : (
              <p className="text-sm py-2 px-3 bg-muted rounded-md">{profile.department}</p>
            )}
          </div>

          {/* Phone Number */}
          <div className="space-y-2">
            <Label htmlFor="phoneNumber" className="font-semibold flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              Phone Number (Optional)
            </Label>
            {isEditing ? (
              <Input
                id="phoneNumber"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                placeholder="+1 (555) 123-4567"
              />
            ) : (
              <p className="text-sm py-2 px-3 bg-muted rounded-md">
                {profile.phoneNumber || "Not provided"}
              </p>
            )}
          </div>

          {/* Account Info (Read-only) */}
          <div className="pt-4 border-t space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="font-semibold flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  Member Since
                </Label>
                <p className="text-sm py-2 px-3 bg-muted rounded-md">
                  {new Date(profile.createdAt).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>

              <div className="space-y-2">
                <Label className="font-semibold flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  Last Updated
                </Label>
                <p className="text-sm py-2 px-3 bg-muted rounded-md">
                  {new Date(profile.updatedAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

