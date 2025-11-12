"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Loader2,
  Network,
  HardDrive,
  Users,
  FileText,
  Activity,
  AlertTriangle,
  BarChart3,
  Settings,
  Router as RouterIcon,
  Command,
  Wifi,
  MapPin,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface SearchResult {
  id: string;
  title: string;
  description: string;
  category: "equipment" | "ip-address" | "user" | "report" | "page" | "alert" | "node";
  path: string;
  icon: any;
  metadata?: string;
}

const quickLinks: SearchResult[] = [
  {
    id: "dashboard",
    title: "Dashboard",
    description: "Main dashboard overview",
    category: "page",
    path: "/dashboard",
    icon: BarChart3,
  },
  {
    id: "equipment",
    title: "Equipment Management",
    description: "Manage mining equipment",
    category: "page",
    path: "/equipment",
    icon: HardDrive,
  },
  {
    id: "ip-management",
    title: "IP Management",
    description: "Manage IP addresses",
    category: "page",
    path: "/ip-management",
    icon: Network,
  },
  {
    id: "users",
    title: "User Management",
    description: "Manage system users",
    category: "page",
    path: "/users",
    icon: Users,
  },
  {
    id: "reports",
    title: "Reports",
    description: "View system reports",
    category: "page",
    path: "/reports",
    icon: FileText,
  },
  {
    id: "alerts",
    title: "Alerts",
    description: "View system alerts",
    category: "page",
    path: "/alerts",
    icon: AlertTriangle,
  },
  {
    id: "network-status",
    title: "Network Status",
    description: "Check network health",
    category: "page",
    path: "/network-status",
    icon: Activity,
  },
  {
    id: "mesh",
    title: "Mesh Topology",
    description: "View mesh network",
    category: "page",
    path: "/mesh",
    icon: RouterIcon,
  },
];

const getCategoryColor = (category: string) => {
  switch (category) {
    case "equipment":
      return "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 border border-blue-200 dark:border-blue-800";
    case "ip-address":
      return "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300 border border-green-200 dark:border-green-800";
    case "user":
      return "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300 border border-purple-200 dark:border-purple-800";
    case "report":
      return "bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300 border border-orange-200 dark:border-orange-800";
    case "page":
      return "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/50 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800";
    case "alert":
      return "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300 border border-red-200 dark:border-red-800";
    case "node":
      return "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800";
    default:
      return "bg-gray-100 text-gray-700 dark:bg-gray-900/50 dark:text-gray-300 border border-gray-200 dark:border-gray-700";
  }
};

export function SystemSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K or Ctrl+K to open search
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen(true);
        setTimeout(() => inputRef.current?.focus(), 100);
      }
      // Escape to close
      if (e.key === "Escape") {
        setIsOpen(false);
        setSearchQuery("");
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Search functionality with real API integration
  useEffect(() => {
    if (!searchQuery.trim()) {
      setResults(quickLinks);
      return;
    }

    setIsSearching(true);
    const timeoutId = setTimeout(async () => {
      try {
        const searchResults: SearchResult[] = [];
        
        // Search pages first (from quick links)
        const pageResults = quickLinks.filter(
          (item) =>
            item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.description.toLowerCase().includes(searchQuery.toLowerCase())
        );
        searchResults.push(...pageResults);

        // Search equipment
        try {
          const equipmentResponse = await fetch(`/api/equipment?search=${encodeURIComponent(searchQuery)}&limit=5`);
          if (equipmentResponse.ok) {
            const equipmentData = await equipmentResponse.json();
            const equipmentResults = equipmentData.equipment?.slice(0, 5).map((eq: any) => ({
              id: `equipment-${eq.id}`,
              title: eq.name,
              description: `${eq.type} - ${eq.location || "Unknown location"} - ${eq.status}`,
              category: "equipment" as const,
              path: `/equipment?search=${eq.name}`,
              icon: HardDrive,
              metadata: eq.nodeId || eq.ip,
            })) || [];
            searchResults.push(...equipmentResults);
          }
        } catch (error) {
          console.error("Equipment search failed:", error);
        }

        // Search IP addresses
        if (/\d/.test(searchQuery)) {
          try {
            const ipResponse = await fetch(`/api/ip-addresses/check?ip=${encodeURIComponent(searchQuery)}`);
            if (ipResponse.ok) {
              const ipData = await ipResponse.json();
              if (ipData.exists) {
                searchResults.push({
                  id: `ip-${ipData.assignment.id}`,
                  title: ipData.assignment.ipAddress,
                  description: `Assigned to ${ipData.assignment.equipment?.name || "Unknown"} - ${ipData.status}`,
                  category: "ip-address" as const,
                  path: `/ip-management?search=${ipData.assignment.ipAddress}`,
                  icon: Network,
                  metadata: ipData.assignment.equipment?.location,
                });
              }
            }
          } catch (error) {
            console.error("IP search failed:", error);
          }
        }

        // Search users (only for admins)
        try {
          const usersResponse = await fetch(`/api/users?search=${encodeURIComponent(searchQuery)}&limit=3`);
          if (usersResponse.ok) {
            const usersData = await usersResponse.json();
            const userResults = usersData.users?.slice(0, 3).map((user: any) => ({
              id: `user-${user.id}`,
              title: `${user.firstName} ${user.lastName}`,
              description: `${user.email} - ${user.role}`,
              category: "user" as const,
              path: `/users?search=${user.email}`,
              icon: Users,
              metadata: user.department,
            })) || [];
            searchResults.push(...userResults);
          }
        } catch (error) {
          console.error("User search failed:", error);
        }

        setResults(searchResults);
        setSelectedIndex(0);
      } catch (error) {
        console.error("Search failed:", error);
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Handle navigation
  const handleSelect = (path: string) => {
    router.push(path);
    setIsOpen(false);
    setSearchQuery("");
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + results.length) % results.length);
    } else if (e.key === "Enter" && results[selectedIndex]) {
      e.preventDefault();
      handleSelect(results[selectedIndex].path);
    }
  };

  return (
    <div className="relative w-full max-w-2xl" ref={searchRef}>
      {/* Search Input */}
      <div
        className={cn(
          "relative flex items-center rounded-lg border transition-all duration-200",
          isOpen
            ? "ring-2 ring-blue-500 border-blue-500 dark:ring-blue-400 dark:border-blue-400"
            : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
        )}
      >
        <Search className="absolute left-3 h-5 w-5 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Search system... (Ctrl+K)"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          className="w-full bg-transparent py-2.5 pl-11 pr-12 text-sm outline-none placeholder:text-gray-400"
        />
        <div className="absolute right-3 flex items-center gap-1">
          {isSearching && <Loader2 className="h-4 w-4 animate-spin text-gray-400" />}
          <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 px-1.5 font-mono text-xs text-gray-600 dark:text-gray-400">
            <Command className="h-3 w-3" />K
          </kbd>
        </div>
      </div>

      {/* Search Results Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-2 w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-2xl max-h-[400px] overflow-y-auto">
          {results.length > 0 ? (
            <div className="p-2">
              <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 px-2 py-1.5">
                {searchQuery ? "Search Results" : "Quick Links"}
              </div>
              {results.map((result, index) => {
                const Icon = result.icon;
                return (
                  <button
                    key={result.id}
                    onClick={() => handleSelect(result.path)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all text-left group",
                      index === selectedIndex
                        ? "bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 shadow-sm"
                        : "hover:bg-gray-50 dark:hover:bg-gray-800/50 border border-transparent hover:border-gray-200 dark:hover:border-gray-700"
                    )}
                  >
                    <div className="flex-shrink-0">
                      <div className={cn(
                        "p-2.5 rounded-lg transition-colors",
                        index === selectedIndex
                          ? "bg-blue-100 dark:bg-blue-800/50"
                          : "bg-gray-100 dark:bg-gray-800 group-hover:bg-gray-200 dark:group-hover:bg-gray-700"
                      )}>
                        <Icon className={cn(
                          "h-4 w-4 transition-colors",
                          index === selectedIndex
                            ? "text-blue-600 dark:text-blue-400"
                            : "text-gray-600 dark:text-gray-400"
                        )} />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-0.5">
                        {result.title}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 truncate">
                        {result.description}
                      </div>
                      {result.metadata && (
                        <div className="text-xs text-gray-500 dark:text-gray-500 mt-0.5 flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {result.metadata}
                        </div>
                      )}
                    </div>
                    <Badge className={cn("text-xs font-medium shrink-0", getCategoryColor(result.category))}>
                      {result.category}
                    </Badge>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center">
              <Search className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                No results found
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Try searching for equipment, users, or pages
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

