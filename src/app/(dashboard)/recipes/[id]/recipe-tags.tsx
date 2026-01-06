"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tag as TagIcon, Plus } from "lucide-react";
import TagManagerModal from "@/components/ui/tag-manager-modal";
import { Tag } from "@/lib/types/recipe";

interface RecipeTagsProps {
  recipeId: string;
  tags: Tag[];
}

export default function RecipeTags({ recipeId, tags }: RecipeTagsProps) {
  const [showTagManager, setShowTagManager] = useState(false);
  const [currentTags, setCurrentTags] = useState(tags);

  return (
    <>
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-2xl font-bold">Tags</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowTagManager(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Manage Tags
          </Button>
        </div>
        {currentTags.length === 0 ? (
          <p className="text-muted-foreground">No tags added yet</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {currentTags.map((tag) => (
              <Badge
                key={tag.id}
                variant="secondary"
                className="gap-1"
                style={{
                  backgroundColor: `${tag.color}20`,
                  borderColor: tag.color,
                }}
              >
                <TagIcon className="h-3 w-3" style={{ color: tag.color }} />
                {tag.name}
              </Badge>
            ))}
          </div>
        )}
      </div>

      <TagManagerModal
        open={showTagManager}
        onOpenChange={setShowTagManager}
        recipeId={recipeId}
        currentTags={currentTags}
        onTagsUpdated={setCurrentTags}
      />
    </>
  );
}
