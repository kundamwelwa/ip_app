"use client";

import { useState, useRef } from "react";
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
import {
  Upload,
  Download,
  FileText,
  CheckCircle,
  AlertTriangle,
  X,
  Loader2,
  FileSpreadsheet,
  Eye,
  Trash2,
} from "lucide-react";
import {
  parseCSVToEquipment,
  validateEquipmentData,
  exportToCSV,
  downloadCSV,
  readFileAsText,
  type EquipmentImportData,
  type ImportResult,
} from "@/lib/equipment-utils";
import { type MiningEquipment } from "@/types/equipment";

interface ImportExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (data: MiningEquipment[]) => void;
  equipment: MiningEquipment[];
}

export function ImportExportDialog({ isOpen, onClose, onImport, equipment }: ImportExportDialogProps) {
  const [activeTab, setActiveTab] = useState<"import" | "export">("import");
  const [importData, setImportData] = useState<EquipmentImportData[]>([]);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<EquipmentImportData[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setIsProcessing(true);

    try {
      const content = await readFileAsText(file);
      const data = parseCSVToEquipment(content);
      setPreviewData(data);
      setImportData(data);
    } catch (error) {
      console.error("Error reading file:", error);
      setImportResult({
        success: false,
        imported: 0,
        errors: ["Failed to read file"],
        warnings: []
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImport = () => {
    setIsProcessing(true);
    
    // Simulate import processing
    setTimeout(() => {
      const result: ImportResult = {
        success: true,
        imported: importData.length,
        errors: [],
        warnings: []
      };

      // Validate each item
      importData.forEach((item, index) => {
        const validation = validateEquipmentData(item);
        if (!validation.isValid) {
          result.errors.push(`Row ${index + 2}: ${validation.errors.join(", ")}`);
        }
      });

      if (result.errors.length > 0) {
        result.success = false;
        result.imported = 0;
      } else {
        // Convert to equipment format and import
        const equipmentData: MiningEquipment[] = importData.map((item, index) => ({
          id: `EQ${Date.now()}${index}`,
          name: item.name,
          type: item.type as MiningEquipment['type'],
          model: item.model,
          manufacturer: item.manufacturer,
          serialNumber: item.serialNumber,
          ipAddress: item.ipAddress,
          macAddress: item.macAddress,
          status: "offline" as const,
          location: item.location,
          operator: item.operator,
          lastMaintenance: new Date(),
          nextMaintenance: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          operatingHours: 0,
          fuelLevel: 0,
          notes: item.notes || '',
          createdAt: new Date(),
          updatedAt: new Date()
        }));

        onImport(equipmentData);
      }

      setImportResult(result);
      setIsProcessing(false);
    }, 2000);
  };

  const handleExport = () => {
    const csvContent = exportToCSV(equipment);
    const filename = `equipment-export-${new Date().toISOString().split('T')[0]}.csv`;
    downloadCSV(csvContent, filename);
  };

  const handleClose = () => {
    setActiveTab("import");
    setImportData([]);
    setImportResult(null);
    setSelectedFile(null);
    setPreviewData([]);
    onClose();
  };

  const removePreviewItem = (index: number) => {
    const newData = previewData.filter((_, i) => i !== index);
    setPreviewData(newData);
    setImportData(newData);
  };

  console.log("ImportExportDialog render - isOpen:", isOpen);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center space-x-2">
            {activeTab === "import" ? (
              <Upload className="h-5 w-5 text-primary" />
            ) : (
              <Download className="h-5 w-5 text-primary" />
            )}
            <span>{activeTab === "import" ? "Import Equipment" : "Export Equipment"}</span>
          </DialogTitle>
          <DialogDescription>
            {activeTab === "import" 
              ? "Import equipment data from CSV file" 
              : "Export equipment data to CSV file"
            }
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6 pr-2">
          {/* Tab Navigation */}
          <div className="flex space-x-2 border-b">
            <Button
              variant={activeTab === "import" ? "default" : "ghost"}
              onClick={() => setActiveTab("import")}
              className="rounded-b-none"
            >
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Button>
            <Button
              variant={activeTab === "export" ? "default" : "ghost"}
              onClick={() => setActiveTab("export")}
              className="rounded-b-none"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>

          {activeTab === "import" ? (
            <div className="space-y-6">
              {/* File Upload */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Upload CSV File</h3>
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                  <FileSpreadsheet className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Drag and drop your CSV file here, or click to browse
                    </p>
                    <Input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isProcessing}
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Choose File
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {selectedFile && (
                  <div className="flex items-center space-x-2 p-3 bg-muted/50 rounded-lg">
                    <FileText className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">{selectedFile.name}</span>
                    <Badge variant="outline">{selectedFile.size} bytes</Badge>
                  </div>
                )}
              </div>

              {/* Preview Data */}
              {previewData.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Preview Data</h3>
                    <Badge variant="outline">{previewData.length} items</Badge>
                  </div>
                  
                  <div className="border rounded-lg overflow-hidden">
                    <div className="max-h-60 overflow-y-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/50 sticky top-0">
                          <tr>
                            <th className="p-2 text-left">Name</th>
                            <th className="p-2 text-left">Type</th>
                            <th className="p-2 text-left">Model</th>
                            <th className="p-2 text-left">IP Address</th>
                            <th className="p-2 text-left">Location</th>
                            <th className="p-2 text-left">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {previewData.map((item, index) => (
                            <tr key={index} className="border-t">
                              <td className="p-2">{item.name}</td>
                              <td className="p-2">{item.type}</td>
                              <td className="p-2">{item.model}</td>
                              <td className="p-2">{item.ipAddress}</td>
                              <td className="p-2">{item.location}</td>
                              <td className="p-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removePreviewItem(index)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Import Result */}
              {importResult && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Import Result</h3>
                  <div className={`p-4 rounded-lg border ${
                    importResult.success 
                      ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800" 
                      : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                  }`}>
                    <div className="flex items-center space-x-2 mb-2">
                      {importResult.success ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                      )}
                      <span className={`font-medium ${
                        importResult.success 
                          ? "text-green-800 dark:text-green-200" 
                          : "text-red-800 dark:text-red-200"
                      }`}>
                        {importResult.success ? "Import Successful" : "Import Failed"}
                      </span>
                    </div>
                    <p className={`text-sm ${
                      importResult.success 
                        ? "text-green-700 dark:text-green-300" 
                        : "text-red-700 dark:text-red-300"
                    }`}>
                      {importResult.success 
                        ? `Successfully imported ${importResult.imported} equipment items.`
                        : `Failed to import equipment. ${importResult.errors.length} errors found.`
                      }
                    </p>
                    
                    {importResult.errors.length > 0 && (
                      <div className="mt-3">
                        <h4 className="font-medium text-red-800 dark:text-red-200 mb-2">Errors:</h4>
                        <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
                          {importResult.errors.map((error, index) => (
                            <li key={index} className="flex items-start space-x-2">
                              <span className="text-red-500 mt-1">•</span>
                              <span>{error}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Export Options */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Export Options</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Equipment Data</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Export all equipment information including status, maintenance, and operational data.
                    </p>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Total Equipment:</span>
                        <span className="font-medium">{equipment.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Online:</span>
                        <span className="font-medium text-green-600">
                          {equipment.filter(e => e.status === 'online').length}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Offline:</span>
                        <span className="font-medium text-red-600">
                          {equipment.filter(e => e.status === 'offline').length}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Export Format</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      CSV format compatible with Excel and other spreadsheet applications.
                    </p>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center space-x-2">
                        <FileSpreadsheet className="h-4 w-4 text-primary" />
                        <span>CSV Format</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>UTF-8 Encoding</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>Excel Compatible</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Export Preview */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Export Preview</h3>
                <div className="border rounded-lg overflow-hidden">
                  <div className="max-h-60 overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50 sticky top-0">
                        <tr>
                          <th className="p-2 text-left">ID</th>
                          <th className="p-2 text-left">Name</th>
                          <th className="p-2 text-left">Type</th>
                          <th className="p-2 text-left">Status</th>
                          <th className="p-2 text-left">Location</th>
                          <th className="p-2 text-left">IP Address</th>
                        </tr>
                      </thead>
                      <tbody>
                        {equipment.slice(0, 10).map((item) => (
                          <tr key={item.id} className="border-t">
                            <td className="p-2">{item.id}</td>
                            <td className="p-2">{item.name}</td>
                            <td className="p-2">{item.type}</td>
                            <td className="p-2">
                              <Badge variant={item.status === 'online' ? 'default' : 'destructive'}>
                                {item.status}
                              </Badge>
                            </td>
                            <td className="p-2">{item.location}</td>
                            <td className="p-2">{item.ipAddress}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {equipment.length > 10 && (
                    <div className="p-2 text-center text-sm text-muted-foreground border-t">
                      ... and {equipment.length - 10} more items
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex-shrink-0 border-t pt-4">
          <Button variant="outline" onClick={handleClose}>
            <X className="h-4 w-4 mr-2" />
            Close
          </Button>
          {activeTab === "import" ? (
            <Button 
              onClick={handleImport} 
              disabled={importData.length === 0 || isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Import Equipment
                </>
              )}
            </Button>
          ) : (
            <Button onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
