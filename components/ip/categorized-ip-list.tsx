"use client";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    getIPCategory,
    CATEGORY_ORDER,
    IPCategory,
} from "@/lib/ip-categories";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, MapPin, Clock, CheckCircle } from "lucide-react";
import { useState } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

// Define a flexible interface that matches your IPAddress type
export interface IPAddressItem {
    id: string;
    address: string;
    status: string;
    assignedTo?: string;
    equipmentType?: string;
    location?: string;
    lastSeen?: Date | string | null;
    subnet?: string;
    gateway?: string | null;
    dns?: string | null;
    isReserved?: boolean;
    notes?: string | null;
    createdAt?: Date;
    updatedAt?: Date;
    [key: string]: any; // Allow other properties
}

interface CategorizedIPListProps {
    ipAddresses: IPAddressItem[];
    onAssign?: (ip: IPAddressItem) => void;
    onUnassign?: (ip: IPAddressItem) => void;
    onEdit?: (ip: IPAddressItem) => void;
    onDelete?: (id: string, address: string) => void;
    readOnly?: boolean;
    // Selection props
    selectedIds?: Set<string>;
    onSelect?: (id: string) => void;
    onSelectAll?: () => void;
    isAllSelected?: boolean;
}

export function CategorizedIPList({
    ipAddresses,
    onAssign,
    onUnassign,
    onEdit,
    onDelete,
    readOnly = false,
    selectedIds,
    onSelect,
    onSelectAll,
    isAllSelected,
}: CategorizedIPListProps) {
    // Group IPs
    const groupedIPs = ipAddresses.reduce((acc, ip) => {
        const category = getIPCategory(ip.address);
        if (!acc[category]) {
            acc[category] = [];
        }
        acc[category].push(ip);
        return acc;
    }, {} as Record<IPCategory, IPAddressItem[]>);

    // Define counts for badges
    const getCategoryStats = (ips: IPAddressItem[]) => {
        const total = ips.length;
        const assigned = ips.filter((ip) => ip.status === "ASSIGNED").length;
        const available = ips.filter((ip) => ip.status === "AVAILABLE").length;
        return { total, assigned, available };
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "AVAILABLE":
                return <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">Available</Badge>;
            case "ASSIGNED":
                return <Badge variant="default">Assigned</Badge>;
            case "RESERVED":
                return <Badge variant="outline" className="border-amber-500 text-amber-500">Reserved</Badge>;
            case "OFFLINE":
                return <Badge variant="destructive">Offline</Badge>;
            default:
                return <Badge variant="secondary">{status}</Badge>;
        }
    };

    return (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
            {CATEGORY_ORDER.map((category) => {
                const categoryIPs = groupedIPs[category] || [];
                if (categoryIPs.length === 0) return null;

                const stats = getCategoryStats(categoryIPs);

                return (
                    <CollapsibleCategory
                        key={category}
                        category={category}
                        stats={stats}
                    >
                        <div className="rounded-md border overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        {!readOnly && onSelectAll && (
                                            <TableHead className="w-10 px-2"></TableHead>
                                        )}
                                        <TableHead className="w-[140px]">IP Address</TableHead>
                                        <TableHead className="w-[100px]">Status</TableHead>
                                        <TableHead>Assigned To</TableHead>
                                        {/* Hide less important columns on simplified grid view if needed, but keeping for now as responsive */}
                                        <TableHead className="hidden 2xl:table-cell">Location</TableHead>
                                        <TableHead className="hidden 2xl:table-cell">Last Seen</TableHead>
                                        {!readOnly && <TableHead className="text-right">Action</TableHead>}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {categoryIPs.sort((a, b) => a.address.localeCompare(b.address, undefined, { numeric: true })).map((ip) => (
                                        <TableRow key={ip.id} data-state={selectedIds?.has(ip.id) ? "selected" : undefined}>
                                            {!readOnly && onSelect && (
                                                <TableCell className="px-2">
                                                    <Checkbox
                                                        checked={selectedIds?.has(ip.id)}
                                                        onCheckedChange={() => onSelect(ip.id)}
                                                    />
                                                </TableCell>
                                            )}
                                            <TableCell className="font-mono font-medium text-xs sm:text-sm">
                                                {ip.address}
                                            </TableCell>
                                            <TableCell>
                                                {getStatusBadge(ip.status)}
                                            </TableCell>
                                            <TableCell className="max-w-[150px] truncate">
                                                {ip.assignedTo ? (
                                                    <div>
                                                        <div className="font-medium truncate" title={ip.assignedTo}>{ip.assignedTo}</div>
                                                        {ip.equipmentType && <div className="text-xs text-muted-foreground truncate">{ip.equipmentType}</div>}
                                                    </div>
                                                ) : (
                                                    <span className="text-muted-foreground text-sm">-</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="hidden 2xl:table-cell">
                                                {ip.location ? (
                                                    <div className="flex items-center space-x-1 text-sm truncate">
                                                        <MapPin className="h-3 w-3 text-muted-foreground" />
                                                        <span title={ip.location}>{ip.location}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-muted-foreground">-</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="hidden 2xl:table-cell">
                                                {ip.lastSeen ? (
                                                    <div className="flex items-center space-x-1 text-sm">
                                                        <Clock className="h-3 w-3 text-muted-foreground" />
                                                        <span>
                                                            {new Date(ip.lastSeen).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-muted-foreground text-xs">-</span>
                                                )}
                                            </TableCell>
                                            {!readOnly && (
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end space-x-1">
                                                        {onEdit && (
                                                            <Button
                                                                size="icon"
                                                                variant="ghost"
                                                                className="h-7 w-7"
                                                                onClick={() => onEdit(ip)}
                                                            >
                                                                <Edit className="h-3.5 w-3.5" />
                                                            </Button>
                                                        )}
                                                        {/* Show minimal actions in grid view to save space */}
                                                    </div>
                                                </TableCell>
                                            )}
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CollapsibleCategory>
                );
            })}
        </div>
    );
}

function CollapsibleCategory({
    category,
    stats,
    children
}: {
    category: string,
    stats: { total: number, assigned: number, available: number },
    children: React.ReactNode
}) {
    const [isOpen, setIsOpen] = useState(true);

    return (
        <Collapsible open={isOpen} onOpenChange={setIsOpen} className="space-y-2 h-full flex flex-col">
            <div className="flex items-center justify-between p-2 rounded-lg border bg-card text-card-foreground shadow-sm">
                <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="p-0 hover:bg-transparent w-full justify-start h-auto py-1">
                        {isOpen ? <ChevronDown className="h-4 w-4 mr-2 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 mr-2 text-muted-foreground" />}
                        <div className="flex flex-col items-start text-left">
                            <h3 className="font-semibold text-base">{category}</h3>
                            <div className="flex items-center gap-2 mt-1">
                                <Badge variant="secondary" className="text-[10px] px-1.5 h-5">{stats.total} IPs</Badge>
                                {stats.available > 0 &&
                                    <span className="text-[10px] text-green-600 font-medium bg-green-50 px-1.5 h-5 flex items-center rounded-full border border-green-100">
                                        {stats.available} Free
                                    </span>
                                }
                            </div>
                        </div>
                    </Button>
                </CollapsibleTrigger>
            </div>
            <CollapsibleContent className="flex-1 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0">
                {children}
            </CollapsibleContent>
        </Collapsible>
    );
}
