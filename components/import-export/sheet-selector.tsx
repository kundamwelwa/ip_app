"use client";

import { SheetInfo } from './types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileSpreadsheet, CheckCircle, AlertTriangle } from 'lucide-react';

interface SheetSelectorProps {
  sheets: SheetInfo[];
  selectedSheet: string | null;
  onSelectSheet: (sheetName: string) => void;
  onConfirm: () => void;
}

export function SheetSelector({
  sheets,
  selectedSheet,
  onSelectSheet,
  onConfirm,
}: SheetSelectorProps) {
  const sheetsWithData = sheets.filter(s => s.hasData);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <FileSpreadsheet className="h-5 w-5 text-primary" />
        <div>
          <h3 className="text-lg font-semibold">Select Sheet to Import</h3>
          <p className="text-sm text-muted-foreground">
            The Excel file contains {sheets.length} sheet{sheets.length !== 1 ? 's' : ''}. 
            Select which sheet you want to import data from.
          </p>
        </div>
      </div>

      {sheetsWithData.length === 0 && (
        <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
          <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
              No sheets with data found
            </p>
            <p className="text-sm text-amber-800 dark:text-amber-200">
              The file contains sheets, but they appear to be empty.
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-3">
        {sheets.map((sheet) => (
          <Card
            key={sheet.name}
            className={`cursor-pointer transition-all duration-200 ${
              selectedSheet === sheet.name
                ? 'ring-2 ring-primary bg-primary/5 border-primary shadow-md'
                : sheet.hasData
                ? 'hover:bg-muted/50 hover:border-primary/30'
                : 'opacity-50 cursor-not-allowed'
            }`}
            onClick={() => sheet.hasData && onSelectSheet(sheet.name)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {selectedSheet === sheet.name ? (
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary flex-shrink-0">
                      <CheckCircle className="h-3 w-3 text-primary-foreground" />
                    </div>
                  ) : (
                    <div className={`h-5 w-5 rounded-full border-2 flex-shrink-0 ${
                      sheet.hasData 
                        ? 'border-muted-foreground/30' 
                        : 'border-muted-foreground/10'
                    }`}></div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold truncate">{sheet.name}</h4>
                      {!sheet.hasData && (
                        <Badge variant="outline" className="text-xs">Empty</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span>{sheet.rowCount} rows</span>
                      <span className="text-muted-foreground/50">•</span>
                      <span>{sheet.columnCount} columns</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-end pt-2">
        <Button
          onClick={onConfirm}
          disabled={!selectedSheet}
        >
          {selectedSheet ? (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              Continue with "{selectedSheet}"
            </>
          ) : (
            'Select a sheet to continue'
          )}
        </Button>
      </div>
    </div>
  );
}

