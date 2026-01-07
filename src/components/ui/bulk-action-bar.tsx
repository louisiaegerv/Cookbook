"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Tag as TagIcon, FolderOpen } from "lucide-react";

interface BulkActionBarProps {
  selectedCount: number;
  filteredCount: number;
  onClearSelection: () => void;
  onManageTags: () => void;
  onManageCollections: () => void;
  onSelectAll: () => void;
}

export default function BulkActionBar({
  selectedCount,
  filteredCount,
  onClearSelection,
  onManageTags,
  onManageCollections,
  onSelectAll,
}: BulkActionBarProps) {
  if (selectedCount === 0) return null;

  const allSelected = selectedCount === filteredCount && filteredCount > 0;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
      <div className="bg-background border shadow-lg rounded-lg p-4 flex items-center gap-4 max-w-[90vw]">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-sm">
            {selectedCount} selected
          </Badge>
        </div>

        <div className="h-6 w-px bg-border" />

        <Button
          variant="outline"
          size="sm"
          onClick={allSelected ? onClearSelection : onSelectAll}
          disabled={filteredCount === 0}
          className="gap-2"
        >
          {allSelected ? "Deselect All" : "Select All"}
        </Button>

        <div className="h-6 w-px bg-border" />

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onManageTags}
            className="gap-2"
          >
            <TagIcon className="h-4 w-4" />
            Add Tags
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onManageCollections}
            className="gap-2"
          >
            <FolderOpen className="h-4 w-4" />
            Add to Collections
          </Button>
        </div>

        <div className="h-6 w-px bg-border" />

        <Button
          variant="ghost"
          size="sm"
          onClick={onClearSelection}
          className="gap-2"
        >
          <X className="h-4 w-4" />
          Clear
        </Button>
      </div>
    </div>
  );
}
