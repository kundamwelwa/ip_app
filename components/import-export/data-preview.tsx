"use client";

import { GroupedEquipment, DuplicateInFile } from './types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Truck, 
  Network, 
  AlertTriangle, 
  CheckCircle,
  Server,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface DataPreviewProps {
  data: GroupedEquipment[];
  duplicateIPs: DuplicateInFile[];
  totalIPs: number;
}

export function DataPreview({ data, duplicateIPs, totalIPs }: DataPreviewProps) {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const duplicateIPSet = new Set(duplicateIPs.map((dup) => dup.ipAddress));

  const normalizeIP = (ip: string) => {
    const trimmed = ip.trim();
    const parts = trimmed.split('.');
    if (parts.length !== 4) return trimmed;
    return parts.map((part) => String(Number(part))).join('.');
  };

  const toggleItem = (machineId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(machineId)) {
      newExpanded.delete(machineId);
    } else {
      newExpanded.add(machineId);
    }
    setExpandedItems(newExpanded);
  };

  const toggleAll = () => {
    if (expandedItems.size === data.length) {
      setExpandedItems(new Set());
    } else {
      setExpandedItems(new Set(data.map(item => item.machineId)));
    }
  };

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center p-12 border-2 border-dashed rounded-lg bg-muted/20">
        <div className="text-center space-y-3">
          <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground opacity-30" />
          <div>
            <p className="font-medium text-muted-foreground">No Data to Preview</p>
            <p className="text-sm text-muted-foreground">
              Upload a valid Excel file to see preview
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Server className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Import Preview</h3>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleAll}
          >
            {expandedItems.size === data.length ? 'Collapse All' : 'Expand All'}
          </Button>
          <Badge variant="outline" className="text-sm">
            {data.length} Equipment{data.length !== 1 ? 's' : ''}
          </Badge>
          <Badge variant="outline" className="text-sm">
            {totalIPs} IP{totalIPs !== 1 ? 's' : ''}
          </Badge>
        </div>
      </div>

      {/* Duplicate Warning */}
      {duplicateIPs.length > 0 && (
        <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
          <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-2 flex-1">
            <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
              Duplicate IP Addresses Detected
            </p>
            <p className="text-sm text-amber-800 dark:text-amber-200">
              Found {duplicateIPs.length} duplicate IP{duplicateIPs.length !== 1 ? 's' : ''} inside this file. Review the rows below.
            </p>
            <div className="space-y-2">
              {duplicateIPs.map((dup) => (
                <div key={dup.ipAddress} className="rounded-md border border-amber-200 dark:border-amber-800 p-2 bg-white/60 dark:bg-slate-900/40">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="font-mono text-xs">
                      {dup.ipAddress}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {dup.occurrences.length + 1} entries
                    </span>
                  </div>
                  <ul className="mt-1 text-xs text-amber-900 dark:text-amber-100 space-y-1">
                    {dup.occurrences.map((occ, index) => (
                      <li key={`${dup.ipAddress}-${index}`}>
                        Row {occ.row}: <span className="font-medium">{occ.machineId}</span> — {occ.system}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Data Cards */}
      <ScrollArea className="h-[400px] rounded-lg border p-4 space-y-3">
        <div className="space-y-3 pr-4">
          {data.map((equipment) => {
            const isExpanded = expandedItems.has(equipment.machineId);
            
            return (
              <Card key={equipment.machineId} className="overflow-hidden">
                <Collapsible
                  open={isExpanded}
                  onOpenChange={() => toggleItem(equipment.machineId)}
                >
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          )}
                          <Truck className="h-5 w-5 text-primary" />
                          <div>
                            <CardTitle className="text-base">{equipment.machineId}</CardTitle>
                            <p className="text-sm text-muted-foreground mt-0.5">
                              {equipment.systems.length} system{equipment.systems.length !== 1 ? 's' : ''} / 
                              {equipment.systems.length} IP{equipment.systems.length !== 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>
                        <Badge variant="secondary">
                          {equipment.systems.length}
                        </Badge>
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <CardContent className="p-0 border-t">
                      <div className="divide-y">
                        {equipment.systems.map((system, idx) => (
                          <div
                            key={idx}
                            className="p-4 hover:bg-muted/30 transition-colors"
                          >
                            <div className="flex items-start gap-3">
                              <Network className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                              <div className="flex-1 min-w-0 space-y-2">
                                <div>
                                  <p className="font-medium text-sm">{system.system}</p>
                                  {system.comments && (
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                      {system.comments}
                                    </p>
                                  )}
                                </div>
                                
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                                  <div className="space-y-1">
                                    <p className="text-muted-foreground">IP Address</p>
                                    <p className="font-mono font-medium flex items-center gap-1">
                                      {system.ipAddress}
                                      {duplicateIPSet.has(normalizeIP(system.ipAddress)) && (
                                        <AlertTriangle className="h-3 w-3 text-amber-600" />
                                      )}
                                    </p>
                                  </div>
                                  
                                  {system.subnet && (
                                    <div className="space-y-1">
                                      <p className="text-muted-foreground">Subnet</p>
                                      <p className="font-mono font-medium">{system.subnet}</p>
                                    </div>
                                  )}
                                  
                                  {system.gateway && (
                                    <div className="space-y-1">
                                      <p className="text-muted-foreground">Gateway</p>
                                      <p className="font-mono font-medium">{system.gateway}</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            );
          })}
        </div>
      </ScrollArea>

      {/* Summary Footer */}
      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <CheckCircle className="h-4 w-4" />
          <span>Ready to import</span>
        </div>
        <span className="font-medium">
          Total: {data.length} equipment with {totalIPs} IP addresses
        </span>
      </div>
    </div>
  );
}

