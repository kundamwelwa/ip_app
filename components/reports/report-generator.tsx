"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Calendar, FileText, Loader2, Plus } from "lucide-react";

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  type: string;
  category: "equipment" | "network" | "maintenance" | "alerts" | "custom";
  parameters: {
    name: string;
    label: string;
    type: "date" | "daterange" | "select" | "text" | "number" | "multiselect";
    required: boolean;
    options?: string[];
    defaultValue?: string;
  }[];
  isDefault: boolean;
  estimatedTime?: string;
}

interface ReportGeneratorProps {
  templates: ReportTemplate[];
  onGenerate: (templateId: string, parameters: Record<string, any>) => Promise<void>;
}

export function ReportGenerator({ templates, onGenerate }: ReportGeneratorProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [formData, setFormData] = useState<Record<string, any>>({});

  const handleGenerateClick = (template: ReportTemplate) => {
    setSelectedTemplate(template);
    // Initialize form data with default values
    const initialData: Record<string, any> = {};
    template.parameters.forEach((param) => {
      if (param.defaultValue) {
        initialData[param.name] = param.defaultValue;
      }
    });
    setFormData(initialData);
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!selectedTemplate) return;

    // Validate required fields
    const missingFields = selectedTemplate.parameters
      .filter((p) => p.required && !formData[p.name])
      .map((p) => p.label);

    if (missingFields.length > 0) {
      alert(`Please fill in the following required fields: ${missingFields.join(", ")}`);
      return;
    }

    try {
      setGenerating(true);
      await onGenerate(selectedTemplate.id, formData);
      setDialogOpen(false);
      setFormData({});
    } catch (error) {
      console.error("Error generating report:", error);
      alert("Failed to generate report. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      equipment: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
      network: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
      maintenance: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
      alerts: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
      custom: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
    };
    return colors[category as keyof typeof colors] || colors.custom;
  };

  const groupedTemplates = templates.reduce((acc, template) => {
    if (!acc[template.category]) {
      acc[template.category] = [];
    }
    acc[template.category].push(template);
    return acc;
  }, {} as Record<string, ReportTemplate[]>);

  return (
    <>
      <div className="space-y-6">
        {Object.entries(groupedTemplates).map(([category, categoryTemplates]) => (
          <div key={category}>
            <h3 className="text-lg font-semibold mb-3 capitalize">
              {category} Reports
            </h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {categoryTemplates.map((template) => (
                <Card
                  key={template.id}
                  className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-primary/50"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between mb-2">
                      <FileText className="h-5 w-5 text-primary" />
                      <div className="flex gap-2">
                        {template.isDefault && (
                          <Badge
                            variant="outline"
                            className="text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          >
                            Recommended
                          </Badge>
                        )}
                        <Badge className={`text-xs ${getCategoryColor(template.category)}`}>
                          {template.category}
                        </Badge>
                      </div>
                    </div>
                    <CardTitle className="text-base">{template.name}</CardTitle>
                    <CardDescription className="text-sm">
                      {template.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{template.parameters.length} parameters</span>
                      {template.estimatedTime && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {template.estimatedTime}
                        </span>
                      )}
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleGenerateClick(template)}
                      className="w-full"
                    >
                      <Plus className="h-3 w-3 mr-2" />
                      Generate Report
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Generate Report Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Generate {selectedTemplate?.name}
            </DialogTitle>
            <DialogDescription>{selectedTemplate?.description}</DialogDescription>
          </DialogHeader>

          {selectedTemplate && (
            <div className="space-y-4 py-4">
              {selectedTemplate.parameters.map((param) => (
                <div key={param.name} className="space-y-2">
                  <Label htmlFor={param.name} className="text-sm font-semibold">
                    {param.label}
                    {param.required && <span className="text-red-500 ml-1">*</span>}
                  </Label>

                  {param.type === "text" && (
                    <Input
                      id={param.name}
                      value={formData[param.name] || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, [param.name]: e.target.value })
                      }
                      placeholder={`Enter ${param.label.toLowerCase()}`}
                    />
                  )}

                  {param.type === "number" && (
                    <Input
                      id={param.name}
                      type="number"
                      value={formData[param.name] || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, [param.name]: e.target.value })
                      }
                      placeholder={`Enter ${param.label.toLowerCase()}`}
                    />
                  )}

                  {param.type === "date" && (
                    <Input
                      id={param.name}
                      type="date"
                      value={formData[param.name] || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, [param.name]: e.target.value })
                      }
                    />
                  )}

                  {param.type === "daterange" && (
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs text-muted-foreground">Start Date</Label>
                        <Input
                          type="date"
                          value={formData[`${param.name}_start`] || ""}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              [`${param.name}_start`]: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">End Date</Label>
                        <Input
                          type="date"
                          value={formData[`${param.name}_end`] || ""}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              [`${param.name}_end`]: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>
                  )}

                  {param.type === "select" && param.options && (
                    <Select
                      value={formData[param.name] || ""}
                      onValueChange={(value) =>
                        setFormData({ ...formData, [param.name]: value })
                      }
                    >
                      <SelectTrigger id={param.name}>
                        <SelectValue placeholder={`Select ${param.label.toLowerCase()}`} />
                      </SelectTrigger>
                      <SelectContent>
                        {param.options.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              ))}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDialogOpen(false);
                setFormData({});
              }}
              disabled={generating}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={generating}>
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4 mr-2" />
                  Generate Report
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

