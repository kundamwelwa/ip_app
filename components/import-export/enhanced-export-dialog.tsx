"use client";

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Download,
  X,
  FileSpreadsheet,
  FileText,
  CheckCircle,
  Loader2,
} from 'lucide-react';
import { type MiningEquipment } from '@/types/equipment';
import { exportToExcel } from '@/lib/equipment-utils';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface EnhancedExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  equipment: MiningEquipment[];
}

type ExportFormat = 'xlsx' | 'csv' | 'json';

export function EnhancedExportDialog({
  isOpen,
  onClose,
  equipment,
}: EnhancedExportDialogProps) {
  const [exportFormat, setExportFormat] = useState<ExportFormat>('xlsx');
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    try {
      setIsExporting(true);

      const timestamp = new Date().toISOString().split('T')[0];
      const fileName = `equipment-export-${timestamp}`;

      if (exportFormat === 'xlsx') {
        // Export to Excel
        exportToExcel(equipment, `${fileName}.xlsx`);
      } else if (exportFormat === 'csv') {
        // Export to CSV
        const response = await fetch(`/api/equipment/export?format=csv`);
        if (!response.ok) throw new Error('Failed to export CSV');

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${fileName}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else {
        // Export to JSON
        const response = await fetch(`/api/equipment/export?format=json`);
        if (!response.ok) throw new Error('Failed to export JSON');

        const data = await response.json();
        const jsonString = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${fileName}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }

      // Show success and close
      setTimeout(() => {
        setIsExporting(false);
        onClose();
      }, 500);
    } catch (error) {
      console.error('Error exporting:', error);
      alert(error instanceof Error ? error.message : 'Failed to export equipment');
      setIsExporting(false);
    }
  };

  const getFormatDescription = (format: ExportFormat) => {
    switch (format) {
      case 'xlsx':
        return 'Excel spreadsheet with all equipment data';
      case 'csv':
        return 'Comma-separated values file for compatibility';
      case 'json':
        return 'JSON format for API integration and backups';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] w-[95vw] sm:w-[90vw] md:w-[80vw] lg:w-[70vw] xl:max-w-2xl flex flex-col dialog-scroll">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5 text-primary" />
            <span>Export Equipment Data</span>
          </DialogTitle>
          <DialogDescription>
            Export {equipment.length} equipment records to your preferred format
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4 flex-1 overflow-y-auto pr-2">
          {/* Summary Card */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="p-3 sm:p-4 border rounded-lg bg-muted/30">
              <p className="text-xs sm:text-sm text-muted-foreground mb-1">Total Equipment</p>
              <p className="text-xl sm:text-2xl font-bold">{equipment.length}</p>
            </div>
            <div className="p-3 sm:p-4 border rounded-lg bg-muted/30">
              <p className="text-xs sm:text-sm text-muted-foreground mb-1">Online</p>
              <p className="text-xl sm:text-2xl font-bold text-green-600">
                {equipment.filter(e => {
                  const status = typeof e.status === 'string' ? e.status.toUpperCase() : e.status;
                  return status === 'ONLINE';
                }).length}
              </p>
            </div>
            <div className="p-3 sm:p-4 border rounded-lg bg-muted/30">
              <p className="text-xs sm:text-sm text-muted-foreground mb-1">Offline</p>
              <p className="text-xl sm:text-2xl font-bold text-red-600">
                {equipment.filter(e => {
                  const status = typeof e.status === 'string' ? e.status.toUpperCase() : e.status;
                  return status === 'OFFLINE';
                }).length}
              </p>
            </div>
            <div className="p-3 sm:p-4 border rounded-lg bg-muted/30">
              <p className="text-xs sm:text-sm text-muted-foreground mb-1">Types</p>
              <p className="text-xl sm:text-2xl font-bold">
                {new Set(equipment.map(e => e.type)).size}
              </p>
            </div>
          </div>

          {/* Format Selection */}
          <div className="space-y-3 sm:space-y-4">
            <h3 className="font-semibold text-sm sm:text-base">Select Export Format</h3>
            
            <RadioGroup value={exportFormat} onValueChange={(value) => setExportFormat(value as ExportFormat)}>
              <div className="space-y-2 sm:space-y-3">
                {/* Excel Option */}
                <div 
                  className={`flex items-start space-x-2 sm:space-x-3 p-3 sm:p-4 border rounded-lg cursor-pointer transition-all ${
                    exportFormat === 'xlsx' 
                      ? 'border-primary bg-primary/5 ring-2 ring-primary' 
                      : 'hover:border-primary/50'
                  }`}
                  onClick={() => setExportFormat('xlsx')}
                >
                  <RadioGroupItem value="xlsx" id="xlsx" className="mt-0.5 sm:mt-1 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 sm:mb-1 flex-wrap">
                      <FileSpreadsheet className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-600 flex-shrink-0" />
                      <Label htmlFor="xlsx" className="text-sm sm:text-base font-medium cursor-pointer">
                        Excel (.xlsx)
                      </Label>
                      <Badge variant="secondary" className="text-xs">Recommended</Badge>
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      {getFormatDescription('xlsx')}
                    </p>
                  </div>
                </div>

                {/* CSV Option */}
                <div 
                  className={`flex items-start space-x-2 sm:space-x-3 p-3 sm:p-4 border rounded-lg cursor-pointer transition-all ${
                    exportFormat === 'csv' 
                      ? 'border-primary bg-primary/5 ring-2 ring-primary' 
                      : 'hover:border-primary/50'
                  }`}
                  onClick={() => setExportFormat('csv')}
                >
                  <RadioGroupItem value="csv" id="csv" className="mt-0.5 sm:mt-1 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 sm:mb-1">
                      <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600 flex-shrink-0" />
                      <Label htmlFor="csv" className="text-sm sm:text-base font-medium cursor-pointer">
                        CSV (.csv)
                      </Label>
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      {getFormatDescription('csv')}
                    </p>
                  </div>
                </div>

                {/* JSON Option */}
                <div 
                  className={`flex items-start space-x-2 sm:space-x-3 p-3 sm:p-4 border rounded-lg cursor-pointer transition-all ${
                    exportFormat === 'json' 
                      ? 'border-primary bg-primary/5 ring-2 ring-primary' 
                      : 'hover:border-primary/50'
                  }`}
                  onClick={() => setExportFormat('json')}
                >
                  <RadioGroupItem value="json" id="json" className="mt-0.5 sm:mt-1 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 sm:mb-1">
                      <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-purple-600 flex-shrink-0" />
                      <Label htmlFor="json" className="text-sm sm:text-base font-medium cursor-pointer">
                        JSON (.json)
                      </Label>
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      {getFormatDescription('json')}
                    </p>
                  </div>
                </div>
              </div>
            </RadioGroup>
          </div>

          {/* Export Info */}
          <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <CheckCircle className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs sm:text-sm text-blue-900 dark:text-blue-100">
              Export includes all equipment data, IP addresses, status, and metadata
            </p>
          </div>
        </div>

        <DialogFooter className="flex-shrink-0 gap-2 sm:gap-0">
          <Button 
            variant="outline" 
            onClick={onClose} 
            disabled={isExporting}
            className="flex-1 sm:flex-none"
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button 
            onClick={handleExport} 
            disabled={isExporting || equipment.length === 0}
            className="flex-1 sm:flex-none"
          >
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                <span className="hidden sm:inline">Exporting...</span>
                <span className="sm:hidden">Export...</span>
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Export as {exportFormat.toUpperCase()}</span>
                <span className="sm:hidden">{exportFormat.toUpperCase()}</span>
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

