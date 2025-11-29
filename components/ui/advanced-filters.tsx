"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Filter, X, CheckCircle } from "lucide-react";

export interface FilterOption {
  id: string;
  label: string;
  type: "select" | "text" | "date" | "number";
  options?: { value: string; label: string }[];
  placeholder?: string;
}

export interface ActiveFilter {
  id: string;
  label: string;
  value: string;
  displayValue?: string;
}

interface AdvancedFiltersProps {
  filters: FilterOption[];
  activeFilters: ActiveFilter[];
  onApplyFilters: (filters: ActiveFilter[]) => void;
  onClearFilters: () => void;
  className?: string;
}

export function AdvancedFilters({
  filters,
  activeFilters,
  onApplyFilters,
  onClearFilters,
  className,
}: AdvancedFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tempFilters, setTempFilters] = useState<Record<string, string>>({});

  const handleApply = () => {
    const newActiveFilters: ActiveFilter[] = Object.entries(tempFilters)
      .filter(([_, value]) => value !== "" && value !== "all")
      .map(([id, value]) => {
        const filter = filters.find((f) => f.id === id);
        const option = filter?.options?.find((o) => o.value === value);
        return {
          id,
          label: filter?.label || id,
          value,
          displayValue: option?.label || value,
        };
      });

    onApplyFilters(newActiveFilters);
    setIsOpen(false);
  };

  const handleClear = () => {
    setTempFilters({});
    onClearFilters();
    setIsOpen(false);
  };

  const removeFilter = (filterId: string) => {
    const updated = activeFilters.filter((f) => f.id !== filterId);
    onApplyFilters(updated);
  };

  const activeFilterCount = activeFilters.length;

  return (
    <div className={className}>
      <div className="flex items-center gap-2 flex-wrap">
        {/* Filter Button */}
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-9">
              <Filter className="h-4 w-4 mr-2" />
              Filters
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-2 px-1.5 py-0 text-xs">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="start">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-sm">Advanced Filters</h4>
                {activeFilterCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={handleClear}>
                    Clear all
                  </Button>
                )}
              </div>

              <div className="space-y-3">
                {filters.map((filter) => (
                  <div key={filter.id} className="space-y-2">
                    <Label htmlFor={filter.id} className="text-xs font-medium">
                      {filter.label}
                    </Label>
                    {filter.type === "select" && filter.options && (
                      <Select
                        value={tempFilters[filter.id] || "all"}
                        onValueChange={(value) =>
                          setTempFilters({ ...tempFilters, [filter.id]: value })
                        }
                      >
                        <SelectTrigger id={filter.id} className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All</SelectItem>
                          {filter.options.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    {filter.type === "text" && (
                      <Input
                        id={filter.id}
                        type="text"
                        placeholder={filter.placeholder || `Filter by ${filter.label}`}
                        value={tempFilters[filter.id] || ""}
                        onChange={(e) =>
                          setTempFilters({ ...tempFilters, [filter.id]: e.target.value })
                        }
                        className="h-9"
                      />
                    )}
                    {filter.type === "number" && (
                      <Input
                        id={filter.id}
                        type="number"
                        placeholder={filter.placeholder || `Filter by ${filter.label}`}
                        value={tempFilters[filter.id] || ""}
                        onChange={(e) =>
                          setTempFilters({ ...tempFilters, [filter.id]: e.target.value })
                        }
                        className="h-9"
                      />
                    )}
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2 pt-2 border-t">
                <Button variant="outline" size="sm" onClick={() => setIsOpen(false)} className="flex-1">
                  Cancel
                </Button>
                <Button size="sm" onClick={handleApply} className="flex-1">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Apply
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Active Filter Badges */}
        {activeFilters.map((filter) => (
          <Badge
            key={filter.id}
            variant="secondary"
            className="gap-1 pr-1 pl-3 h-9"
          >
            <span className="text-xs">
              <span className="font-semibold">{filter.label}:</span>{" "}
              {filter.displayValue}
            </span>
            <button
              onClick={() => removeFilter(filter.id)}
              className="ml-1 rounded-sm hover:bg-secondary-foreground/20 p-0.5"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>
    </div>
  );
}

// Hook to use with advanced filters
export function useAdvancedFilters<T>(
  data: T[],
  filterFn: (item: T, filters: ActiveFilter[]) => boolean
) {
  const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>([]);

  const filteredData = data.filter((item) => {
    if (activeFilters.length === 0) return true;
    return filterFn(item, activeFilters);
  });

  const applyFilters = (filters: ActiveFilter[]) => {
    setActiveFilters(filters);
  };

  const clearFilters = () => {
    setActiveFilters([]);
  };

  return {
    filteredData,
    activeFilters,
    applyFilters,
    clearFilters,
    hasActiveFilters: activeFilters.length > 0,
  };
}

