"use client";

import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";
import { FolderOpen, Plus } from "lucide-react";
import { useState, useEffect } from "react";
import { Collection } from "@/lib/types/recipe";
import CollectionManagerModal from "@/components/ui/collection-manager-modal";

interface RecipeCollectionsProps {
  recipeId: string;
  collections?: Collection[];
}

export default function RecipeCollections({
  recipeId,
  collections = [],
}: RecipeCollectionsProps) {
  const [showCollectionManager, setShowCollectionManager] = useState(false);
  const [currentCollections, setCurrentCollections] =
    useState<Collection[]>(collections);

  useEffect(() => {
    setCurrentCollections(collections);
  }, [collections]);

  if (currentCollections.length === 0) {
    return (
      <div className="flex items-center gap-2 my-3">
        <button
          onClick={() => setShowCollectionManager(true)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Add to collection</span>
        </button>
        <CollectionManagerModal
          open={showCollectionManager}
          onOpenChange={setShowCollectionManager}
          recipeId={recipeId}
          currentCollections={currentCollections}
          onCollectionsUpdated={setCurrentCollections}
        />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-sm text-muted-foreground">In:</span>
      <div className="flex flex-wrap gap-2">
        {currentCollections.map((collection) => (
          <Badge
            key={collection.id}
            variant="secondary"
            className="gap-1 cursor-pointer hover:bg-muted-foreground/20 transition-colors"
            onClick={() =>
              (window.location.href = `/collections/${collection.id}`)
            }
          >
            <FolderOpen className="h-3 w-3" />
            {collection.name}
          </Badge>
        ))}
      </div>
      <button
        onClick={() => setShowCollectionManager(true)}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <Plus className="h-4 w-4" />
      </button>
      <CollectionManagerModal
        open={showCollectionManager}
        onOpenChange={setShowCollectionManager}
        recipeId={recipeId}
        currentCollections={currentCollections}
        onCollectionsUpdated={setCurrentCollections}
      />
    </div>
  );
}
