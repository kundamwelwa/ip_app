"use client";

import { useState, useEffect } from "react";
import { CategorizedIPList, IPAddressItem } from "@/components/ip/categorized-ip-list";
import { Loader2, AlertTriangle } from "lucide-react";

export function DashboardIPTableSection() {
    const [ipAddresses, setIPAddresses] = useState<IPAddressItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchIPs = async () => {
            try {
                setLoading(true);
                const response = await fetch("/api/ip-addresses?limit=1000");

                if (!response.ok) {
                    throw new Error("Failed to fetch IP addresses");
                }

                const data = await response.json();

                // Transform and map to IPAddressItem
                const items: IPAddressItem[] = data.ipAddresses.map((ip: any) => ({
                    id: ip.id,
                    address: ip.address,
                    status: ip.status,
                    assignedTo: ip.assignments?.[0]?.equipment?.name,
                    equipmentType: ip.assignments?.[0]?.equipment?.type,
                    location: ip.assignments?.[0]?.equipment?.location,
                    lastSeen: ip.assignments?.[0]?.lastSeen,
                    subnet: ip.subnet,
                    gateway: ip.gateway,
                    isReserved: ip.isReserved,
                    notes: ip.notes
                }));

                setIPAddresses(items);
            } catch (err) {
                console.error("Error fetching IPs for dashboard:", err);
                setError(err instanceof Error ? err.message : "Failed to load IP data");
            } finally {
                setLoading(false);
            }
        };

        fetchIPs();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center p-8 text-red-500">
                <AlertTriangle className="h-5 w-5 mr-2" />
                <span>{error}</span>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-semibold tracking-tight">IP Address Categories</h2>
                    <p className="text-sm text-muted-foreground">
                        Overview of IP addresses grouped by network segment
                    </p>
                </div>
            </div>
            <CategorizedIPList
                ipAddresses={ipAddresses}
                readOnly={true}
            />
        </div>
    );
}
