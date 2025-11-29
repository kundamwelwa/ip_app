"use client";

import { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Upload,
  X,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle,
  Download,
} from 'lucide-react';
import { SheetSelector } from './sheet-selector';
import { DataPreview } from './data-preview';
import { ProgressTracker } from './progress-tracker';
import {
  SheetInfo,
  GroupedEquipment,
  ImportProgress,
  DuplicateCheck,
  DuplicateInFile,
  ImportResult,
} from './types';
import {
  detectSheets,
  parseExcelSheet,
  validateExcelStructure,
  inferEquipmentType,
  generateEquipmentName,
} from '@/lib/advanced-excel-parser';
import {
  checkDuplicateIPs,
  extractIPAddresses,
  filterDuplicates,
  generateDuplicateReport,
} from '@/lib/duplicate-detector';

interface EnhancedImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type ImportStep = 'upload' | 'sheet-select' | 'preview' | 'importing' | 'complete';

export function EnhancedImportDialog({
  isOpen,
  onClose,
  onSuccess,
}: EnhancedImportDialogProps) {
  const [currentStep, setCurrentStep] = useState<ImportStep>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [sheets, setSheets] = useState<SheetInfo[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<GroupedEquipment[]>([]);
  const [duplicateIPs, setDuplicateIPs] = useState<DuplicateInFile[]>([]);
  const [totalIPs, setTotalIPs] = useState(0);
  const [progress, setProgress] = useState<ImportProgress>({
    stage: 'idle',
    message: '',
    progress: 0,
  });
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetDialog = () => {
    setCurrentStep('upload');
    setSelectedFile(null);
    setSheets([]);
    setSelectedSheet(null);
    setParsedData([]);
    setDuplicateIPs([]);
    setTotalIPs(0);
    setProgress({ stage: 'idle', message: '', progress: 0 });
    setImportResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    resetDialog();
    onClose();
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setSelectedFile(file);

    try {
      // Validate structure
      setProgress({
        stage: 'reading',
        message: 'Validating Excel file structure...',
        progress: 10,
      });

      const validation = await validateExcelStructure(file);
      
      if (!validation.isValid) {
        setError(validation.errors.join('; '));
        setProgress({ stage: 'error', message: 'Invalid file structure', progress: 0 });
        return;
      }

      // Detect sheets
      setProgress({
        stage: 'reading',
        message: 'Detecting sheets in workbook...',
        progress: 30,
      });

      const detectedSheets = await detectSheets(file);
      setSheets(detectedSheets);

      setProgress({
        stage: 'reading',
        message: `Found ${detectedSheets.length} sheet(s)`,
        progress: 100,
      });

      // If only one sheet with data, auto-select it
      const sheetsWithData = detectedSheets.filter((s) => s.hasData);
      if (sheetsWithData.length === 1) {
        setSelectedSheet(sheetsWithData[0].name);
        await parseSheet(file, sheetsWithData[0].name);
      } else {
        setCurrentStep('sheet-select');
        setProgress({ stage: 'idle', message: '', progress: 0 });
      }
    } catch (err) {
      console.error('Error processing file:', err);
      setError(err instanceof Error ? err.message : 'Failed to process file');
      setProgress({ stage: 'error', message: 'File processing failed', progress: 0 });
    }
  };

  const handleSheetConfirm = async () => {
    if (!selectedFile || !selectedSheet) return;
    await parseSheet(selectedFile, selectedSheet);
  };

  const parseSheet = async (file: File, sheetName: string) => {
    try {
      setProgress({
        stage: 'parsing',
        message: `Parsing data from "${sheetName}"...`,
        progress: 20,
      });

      const result = await parseExcelSheet(file, sheetName);

      setProgress({
        stage: 'grouping',
        message: 'Grouping equipment and systems...',
        progress: 50,
      });

      // Simulate grouping delay for UX
      await new Promise((resolve) => setTimeout(resolve, 500));

      setParsedData(result.data);
      setDuplicateIPs(result.duplicateIPs);
      setTotalIPs(result.totalIPs);

      setProgress({
        stage: 'checking',
        message: 'Checking for duplicates in system...',
        progress: 70,
      });

      // Check for duplicates in the system
      const allIPs = extractIPAddresses(result.data);
      await checkDuplicateIPs(allIPs);

      setProgress({
        stage: 'idle',
        message: 'Ready to import',
        progress: 100,
      });

      setCurrentStep('preview');
    } catch (err) {
      console.error('Error parsing sheet:', err);
      setError(err instanceof Error ? err.message : 'Failed to parse data');
      setProgress({ stage: 'error', message: 'Parsing failed', progress: 0 });
    }
  };

  const handleImport = async () => {
    try {
      setCurrentStep('importing');
      setProgress({
        stage: 'checking',
        message: 'Final check for duplicates...',
        progress: 10,
      });

      // Get all IP addresses
      const allIPs = extractIPAddresses(parsedData);
      const duplicateChecks = await checkDuplicateIPs(allIPs);

      setProgress({
        stage: 'checking',
        message: `Found ${duplicateChecks.filter((d) => d.existsInSystem).length} existing IPs`,
        progress: 25,
      });

      // Filter out duplicates
      const { filtered, skipped, warnings } = filterDuplicates(parsedData, duplicateChecks);

      if (filtered.length === 0) {
        setImportResult({
          success: false,
          imported: 0,
          skipped,
          errors: ['All IP addresses already exist in the system'],
          warnings,
          duplicates: duplicateChecks,
        });
        setProgress({ stage: 'error', message: 'No new data to import', progress: 0 });
        setCurrentStep('complete');
        return;
      }

      const totalIPs = filtered.reduce((sum, e) => sum + e.systems.length, 0);
      setProgress({
        stage: 'importing',
        message: `Importing ${filtered.length} equipment (${totalIPs} IP addresses total)...`,
        progress: 40,
      });

      const equipmentToImport = filtered.map((equipment) => {
        const firstSystem = equipment.systems[0];
        const equipmentType = inferEquipmentType(equipment.machineId, firstSystem?.system || '');
        
        const equipmentName = equipment.machineId;

        // Collect all IP addresses for this equipment
        const ipAddresses = equipment.systems.map((system) => ({
          address: system.ipAddress,
          subnet: system.subnet || '255.255.255.0',
          gateway: system.gateway || null,
          dns: null,
          notes: system.comments || null,
        }));

        // Combine all system comments into notes
        const allComments = equipment.systems
          .map(s => s.comments)
          .filter(Boolean)
          .join('; ');

        return {
          name: equipmentName,
          type: equipmentType,
          model: '',
          manufacturer: '',
          serialNumber: equipment.machineId,
          macAddress: '', // Will be generated by the server
          status: 'OFFLINE',
          location: '',
          operator: '',
          notes: allComments || `Imported via advanced import system - ${equipment.systems.length} systems`,
          ipAddresses: ipAddresses, // Array of all IP addresses for this equipment
        };
      });

      setProgress({
        stage: 'importing',
        message: 'Sending data to server...',
        progress: 60,
      });

      // Send to API
      const response = await fetch('/api/equipment/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ equipment: equipmentToImport }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to import equipment');
      }

      setProgress({
        stage: 'importing',
        message: 'Processing import results...',
        progress: 90,
      });

      // Simulate processing delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      const duplicateReport = generateDuplicateReport(duplicateChecks);

      setImportResult({
        success: data.results.successful > 0,
        imported: data.results.successful,
        skipped: skipped + (data.results.failed || 0),
        errors: data.results.errors || [],
        warnings: [...warnings, ...duplicateReport.duplicateDetails],
        duplicates: duplicateChecks,
      });

      setProgress({
        stage: 'complete',
        message: `Successfully imported ${data.results.successful} equipment`,
        progress: 100,
      });

      setCurrentStep('complete');

      if (data.results.successful > 0) {
        setTimeout(() => {
          onSuccess();
        }, 2000);
      }
    } catch (err) {
      console.error('Error importing data:', err);
      setError(err instanceof Error ? err.message : 'Failed to import data');
      setProgress({ stage: 'error', message: 'Import failed', progress: 0 });
      setImportResult({
        success: false,
        imported: 0,
        skipped: 0,
        errors: [err instanceof Error ? err.message : 'Failed to import data'],
        warnings: [],
        duplicates: [],
      });
      setCurrentStep('complete');
    }
  };

  const downloadTemplate = () => {
    const headers = [
      'MACHINE ID',
      'SYSTEM',
      'IP ADDRESS',
      'SUBNET MASK',
      'GATEWAY',
      'COMMENTS',
    ];

    const sampleData = [
      ['FS03', 'ROCKY COMPUTER', '10.31.141.216', '255.255.255.0', '10.31.141.1', 'ip addresses done'],
      ['FS03', 'PLC S7-400', '10.31.141.213', '255.255.255.0', '10.31.141.1', 'ip addresses done'],
      ['FS03', 'SIBAS', '10.31.141.219', '255.255.255.0', '10.31.141.1', 'ip addresses done'],
      ['FS02', 'ROCKY COMPUTER', '10.31.145.211', '255.255.255.0', '10.31.145.1', 'ip addresses done'],
      ['FS02', 'PLC S7-400', '10.31.145.212', '255.255.255.0', '10.31.145.1', 'ip addresses done'],
    ];

    const csvContent = [headers, ...sampleData]
      .map((row) => row.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'equipment-import-template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col dialog-scroll">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" />
            <span>Import Data</span>
          </DialogTitle>
          <DialogDescription>
            Import equipment and IP addresses from Excel files with smart mapping and duplicate detection
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6 pr-2">
          {/* Progress Tracker */}
          <ProgressTracker progress={progress} />

          {/* Error Display */}
          {error && (
            <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-red-900 dark:text-red-100">Import Error</p>
                <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
              </div>
            </div>
          )}

          {/* Step 1: Upload */}
          {currentStep === 'upload' && (
            <div className="space-y-6">
              {/* Instructions */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="space-y-2 text-sm">
                    <h4 className="font-semibold text-blue-900 dark:text-blue-100">
                      Import Features
                    </h4>
                    <ul className="text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
                      <li>Automatic multi-sheet detection</li>
                      <li>Smart mapping for equipment with multiple IP addresses</li>
                      <li>Duplicate detection and prevention</li>
                      <li>Progress tracking with detailed messages</li>
                      <li>Supports Excel (.xlsx, .xls) formats</li>
                    </ul>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={downloadTemplate}
                      className="mt-2 bg-white dark:bg-slate-800"
                    >
                      <Download className="h-3 w-3 mr-2" />
                      Download Template
                    </Button>
                  </div>
                </div>
              </div>

              {/* File Upload */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Upload Excel File</h3>
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                  <FileSpreadsheet className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Drag and drop your Excel file here, or click to browse
                    </p>
                    <Input
                      ref={fileInputRef}
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={progress.stage !== 'idle'}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Choose File
                    </Button>
                  </div>
                </div>

                {selectedFile && (
                  <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                    <FileSpreadsheet className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">{selectedFile.name}</span>
                    <Badge variant="outline">{Math.round(selectedFile.size / 1024)} KB</Badge>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Sheet Selection */}
          {currentStep === 'sheet-select' && (
            <SheetSelector
              sheets={sheets}
              selectedSheet={selectedSheet}
              onSelectSheet={setSelectedSheet}
              onConfirm={handleSheetConfirm}
            />
          )}

          {/* Step 3: Preview */}
          {currentStep === 'preview' && (
            <DataPreview
              data={parsedData}
              duplicateIPs={duplicateIPs}
              totalIPs={totalIPs}
            />
          )}

          {/* Step 4: Complete */}
          {currentStep === 'complete' && importResult && (
            <div className="space-y-4">
              <div
                className={`p-4 rounded-lg border ${
                  importResult.success
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                    : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  {importResult.success ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                  )}
                  <span
                    className={`font-medium ${
                      importResult.success
                        ? 'text-green-800 dark:text-green-200'
                        : 'text-red-800 dark:text-red-200'
                    }`}
                  >
                    {importResult.success ? 'Import Completed' : 'Import Failed'}
                  </span>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span
                      className={
                        importResult.success
                          ? 'text-green-700 dark:text-green-300'
                          : 'text-red-700 dark:text-red-300'
                      }
                    >
                      Imported:
                    </span>
                    <Badge variant={importResult.success ? 'default' : 'destructive'}>
                      {importResult.imported}
                    </Badge>
                  </div>

                  {importResult.skipped > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Skipped:</span>
                      <Badge variant="outline">{importResult.skipped}</Badge>
                    </div>
                  )}
                </div>

                {importResult.errors.length > 0 && (
                  <div className="mt-3">
                    <h4 className="font-medium text-red-800 dark:text-red-200 mb-2">Errors:</h4>
                    <ul className="text-sm text-red-700 dark:text-red-300 space-y-1 max-h-32 overflow-y-auto">
                      {importResult.errors.map((error, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-red-500 mt-1">•</span>
                          <span>{error}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {importResult.warnings.length > 0 && (
                  <div className="mt-3">
                    <h4 className="font-medium text-amber-800 dark:text-amber-200 mb-2">
                      Warnings:
                    </h4>
                    <ul className="text-sm text-amber-700 dark:text-amber-300 space-y-1 max-h-32 overflow-y-auto">
                      {importResult.warnings.slice(0, 10).map((warning, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-amber-500 mt-1">•</span>
                          <span>{warning}</span>
                        </li>
                      ))}
                      {importResult.warnings.length > 10 && (
                        <li className="text-xs text-muted-foreground">
                          ... and {importResult.warnings.length - 10} more warnings
                        </li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex-shrink-0 border-t pt-4">
          <Button variant="outline" onClick={handleClose}>
            <X className="h-4 w-4 mr-2" />
            {currentStep === 'complete' ? 'Close' : 'Cancel'}
          </Button>

          {currentStep === 'preview' && (
            <Button onClick={handleImport} disabled={parsedData.length === 0}>
              <Upload className="h-4 w-4 mr-2" />
              Import {parsedData.length} Equipment
            </Button>
          )}

          {currentStep === 'complete' && importResult?.success && (
            <Button onClick={handleClose}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Done
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

