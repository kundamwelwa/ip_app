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
        <div className="space-y-6">
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
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        {!readOnly && onSelectAll && (
                                            <TableHead className="w-12">
                                                {/* Only show "select all" on the first category to avoid confusion, or handle partial select all? 
                                                     For simplicity, let's just make it a bulk select for the current view if user wants global select. 
                                                     Actually, standard pattern is global select in toolbar, but we can put it here if requested.
                                                     Better approach: The parent controls "isAllSelected" based on filtered list. 
                                                     We can put a checkbox here that selects ALL in this CATEGORY? 
                                                     Request was "bulk deletion feature", usually means checkboxes.
                                                 */}
                                                {/* We will just add the column space here, the global select all is usually outside or in the first header only.
                                                     However, for consistency, let's add individual row checkboxes.
                                                 */}
                                            </TableHead>
                                        )}
                                        <TableHead className="w-[180px]">IP Address</TableHead>
                                        <TableHead className="w-[120px]">Status</TableHead>
                                        <TableHead>Assigned To</TableHead>
                                        <TableHead>Location</TableHead>
                                        <TableHead className="hidden md:table-cell">Last Seen</TableHead>
                                        {!readOnly && <TableHead className="text-right">Actions</TableHead>}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {categoryIPs.sort((a, b) => a.address.localeCompare(b.address, undefined, { numeric: true })).map((ip) => (
                                        <TableRow key={ip.id} data-state={selectedIds?.has(ip.id) ? "selected" : undefined}>
                                            {!readOnly && onSelect && (
                                                <TableCell>
                                                    <Checkbox
                                                        checked={selectedIds?.has(ip.id)}
                                                        onCheckedChange={() => onSelect(ip.id)}
                                                    />
                                                </TableCell>
                                            )}
                                            <TableCell className="font-mono font-medium">
                                                {ip.address}
                                            </TableCell>
                                            <TableCell>
                                                {getStatusBadge(ip.status)}
                                            </TableCell>
                                            <TableCell>
                                                {ip.assignedTo ? (
                                                    <div>
                                                        <div className="font-medium">{ip.assignedTo}</div>
                                                        {ip.equipmentType && <div className="text-xs text-muted-foreground">{ip.equipmentType}</div>}
                                                    </div>
                                                ) : (
                                                    <span className="text-muted-foreground text-sm">-</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {ip.location ? (
                                                    <div className="flex items-center space-x-1 text-sm">
                                                        <MapPin className="h-3 w-3 text-muted-foreground" />
                                                        <span>{ip.location}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-muted-foreground">-</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="hidden md:table-cell">
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
                                                    <div className="flex items-center justify-end space-x-2">
                                                        {(ip.status === "AVAILABLE" || ip.status === "RESERVED") && onAssign && (
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                className="h-8 px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                                onClick={() => onAssign(ip)}
                                                            >
                                                                Assign
                                                            </Button>
                                                        )}
                                                        {ip.status === "ASSIGNED" && onUnassign && (
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                className="h-8 px-2 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                                                                onClick={() => onUnassign(ip)}
                                                            >
                                                                Unassign
                                                            </Button>
                                                        )}
                                                        {onEdit && (
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                className="h-8 w-8 p-0"
                                                                onClick={() => onEdit(ip)}
                                                            >
                                                                <Edit className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                        {onDelete && (
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                                onClick={() => onDelete(ip.id, ip.address)}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        )}
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
        <Collapsible open={isOpen} onOpenChange={setIsOpen} className="space-y-2">
            <div className="flex items-center justify-between bg-muted/30 p-2 rounded-lg border">
                <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="p-0 hover:bg-transparent w-full justify-start">
                        {isOpen ? <ChevronDown className="h-4 w-4 mr-2" /> : <ChevronRight className="h-4 w-4 mr-2" />}
                        <h3 className="text-lg font-semibold">{category}</h3>
                        <div className="ml-4 flex items-center space-x-2">
                            <Badge variant="secondary" className="text-xs">{stats.total} IPs</Badge>
                            {stats.available > 0 && <Badge variant="outline" className="text-xs border-green-200 text-green-700 bg-green-50">{stats.available} Available</Badge>}
                        </div>
                    </Button>
                </CollapsibleTrigger>
            </div>
            <CollapsibleContent className="animate-in slide-in-from-top-2 data-[state=closed]:animate-out data-[state=closed]:slide-out-to-top-2">
                {children}
            </CollapsibleContent>
        </Collapsible>
    );
}
