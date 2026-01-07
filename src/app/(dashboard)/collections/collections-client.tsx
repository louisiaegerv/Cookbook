"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import CollectionCard from "@/components/ui/collection-card";
import CollectionListItem from "./collection-list-item";
import { CollectionWithRecipes } from "@/lib/types/collection";
import { Grid, LayoutGrid, List } from "lucide-react";

interface CollectionsClientProps {
  collections: CollectionWithRecipes[];
}

type ViewMode = "single" | "double" | "list";

export default function CollectionsClient({
  collections: initialCollections,
}: CollectionsClientProps) {
  const [collections, setCollections] =
    useState<CollectionWithRecipes[]>(initialCollections);
  const [viewMode, setViewMode] = useState<ViewMode>("single");
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  // Load view mode from localStorage on mount
  useEffect(() => {
    const savedViewMode = localStorage.getItem(
      "collections-view-mode"
    ) as ViewMode;
    if (savedViewMode && ["single", "double", "list"].includes(savedViewMode)) {
      setViewMode(savedViewMode);
    }
    setMounted(true);
  }, []);

  // Save view mode to localStorage when it changes
  useEffect(() => {
    if (mounted) {
      localStorage.setItem("collections-view-mode", viewMode);
    }
  }, [viewMode, mounted]);

  // Cycle through view modes
  const cycleViewMode = () => {
    const modes: ViewMode[] = ["single", "double", "list"];
    const currentIndex = modes.indexOf(viewMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    setViewMode(modes[nextIndex]);
  };

  // Get icon for current view mode
  const getViewModeIcon = () => {
    switch (viewMode) {
      case "single":
        return <Grid className="h-4 w-4" />;
      case "double":
        return <LayoutGrid className="h-4 w-4" />;
      case "list":
        return <List className="h-4 w-4" />;
    }
  };

  // Get label for current view mode
  const getViewModeLabel = () => {
    switch (viewMode) {
      case "single":
        return "Single";
      case "double":
        return "2-Column";
      case "list":
        return "List";
    }
  };

  const handleDelete = async (id: string) => {
    const supabase = createClient();
    const { error } = await supabase.from("collections").delete().eq("id", id);

    if (error) {
      console.error("Error deleting collection:", error);
      return;
    }

    // Update local state
    setCollections((prev) => prev.filter((c) => c.id !== id));
    router.refresh();
  };

  return (
    <div className="min-h-screen pb-20 sm:pb-0">
      <div className="container mx-auto md:py-6 px-4">
        {/* Header */}
        <div className="hidden md:flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold">My Collections</h1>
        </div>

        {/* Sticky action bar for mobile */}
        <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b mb-6 sm:hidden">
          <div className="flex items-center justify-between py-3 gap-3">
            {/* View mode toggle */}
            <Button
              variant="outline"
              size="sm"
              onClick={cycleViewMode}
              className="gap-2"
              aria-label={`Current view: ${getViewModeLabel()}, click to cycle through views`}
            >
              {getViewModeIcon()}
              <span className="hidden sm:inline">{getViewModeLabel()}</span>
            </Button>
          </div>
        </div>

        {/* Desktop view mode toggle */}
        <div className="hidden sm:flex items-center justify-end gap-2 mb-6">
          <Button
            variant="outline"
            size="sm"
            onClick={cycleViewMode}
            className="gap-2"
          >
            {getViewModeIcon()}
            {getViewModeLabel()}
          </Button>
        </div>

        {/* Collections grid/list */}
        {!collections || collections.length === 0 ? (
          <div className="text-center py-8 sm:py-12 px-4 sm:px-6 border rounded-lg">
            <div className="space-y-4">
              <h2 className="text-xl sm:text-2xl font-bold">
                No collections yet
              </h2>
              <p className="text-muted-foreground text-sm sm:text-base">
                Get started by creating your first collection
              </p>
            </div>
          </div>
        ) : viewMode === "list" ? (
          <div className="space-y-3 sm:space-y-4">
            {collections.map((collection) => (
              <CollectionListItem
                key={collection.id}
                collection={collection}
                onDelete={handleDelete}
              />
            ))}
          </div>
        ) : (
          <div
            className={
              viewMode === "single"
                ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4"
                : "grid grid-cols-2 gap-3 sm:gap-4"
            }
          >
            {collections.map((collection) => (
              <CollectionCard
                key={collection.id}
                collection={collection}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
