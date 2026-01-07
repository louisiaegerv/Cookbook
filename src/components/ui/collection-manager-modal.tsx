"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { useState, useEffect } from "react";
import { Collection } from "@/lib/types/recipe";
import { Plus, X, Check } from "lucide-react";
import { toast } from "sonner";

interface CollectionManagerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipeId: string;
  currentCollections?: Collection[];
  onCollectionsUpdated?: (collections: Collection[]) => void;
}

export default function CollectionManagerModal({
  open,
  onOpenChange,
  recipeId,
  currentCollections = [],
  onCollectionsUpdated,
}: CollectionManagerModalProps) {
  const supabase = createClient();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedCollections, setSelectedCollections] = useState<Set<string>>(
    new Set(currentCollections.map((c) => c.id))
  );
  const [newCollectionName, setNewCollectionName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      fetchCollections();
    }
  }, [open]);

  useEffect(() => {
    setSelectedCollections(new Set(currentCollections.map((c) => c.id)));
  }, [currentCollections]);

  const fetchCollections = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("collections")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCollections(data || []);
    } catch (error) {
      console.error("Error fetching collections:", error);
      toast.error("Failed to load collections");
    }
  };

  const handleCreateCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCollectionName.trim()) return;

    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("collections")
        .insert({
          user_id: user.id,
          name: newCollectionName.trim(),
        })
        .select()
        .single();

      if (error) throw error;

      setCollections([data, ...collections]);
      setNewCollectionName("");
      toast.success("Collection created successfully");
    } catch (error) {
      console.error("Error creating collection:", error);
      toast.error("Failed to create collection");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleCollection = async (collectionId: string) => {
    const isSelected = selectedCollections.has(collectionId);
    const newSelected = new Set(selectedCollections);

    if (isSelected) {
      newSelected.delete(collectionId);
    } else {
      newSelected.add(collectionId);
    }

    setSelectedCollections(newSelected);

    // Update database
    try {
      if (isSelected) {
        // Remove from collection
        const { error } = await supabase
          .from("recipe_collections")
          .delete()
          .eq("recipe_id", recipeId)
          .eq("collection_id", collectionId);

        if (error) throw error;
      } else {
        // Add to collection
        const { error } = await supabase.from("recipe_collections").insert({
          recipe_id: recipeId,
          collection_id: collectionId,
        });

        if (error) throw error;
      }

      // Notify parent of update
      const updatedCollections = collections.filter((c) =>
        newSelected.has(c.id)
      );
      onCollectionsUpdated?.(updatedCollections);

      toast.success(
        isSelected ? "Removed from collection" : "Added to collection"
      );
    } catch (error) {
      console.error("Error updating collection:", error);
      toast.error("Failed to update collection");
      // Revert selection on error
      setSelectedCollections(selectedCollections);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Collections</DialogTitle>
          <DialogDescription>
            Add this recipe to your collections or create new ones
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Create new collection */}
          <form onSubmit={handleCreateCollection} className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="new-collection" className="sr-only">
                New Collection Name
              </Label>
              <Input
                id="new-collection"
                placeholder="New collection name..."
                value={newCollectionName}
                onChange={(e) => setNewCollectionName(e.target.value)}
                disabled={loading}
              />
            </div>
            <Button
              type="submit"
              size="icon"
              disabled={loading || !newCollectionName.trim()}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </form>

          {/* Collections list */}
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {collections.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No collections yet. Create one above!
              </p>
            ) : (
              collections.map((collection) => {
                const isSelected = selectedCollections.has(collection.id);
                return (
                  <div
                    key={collection.id}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => handleToggleCollection(collection.id)}
                  >
                    <div className="flex-1">
                      <p className="font-medium">{collection.name}</p>
                      {collection.description && (
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {collection.description}
                        </p>
                      )}
                    </div>
                    {isSelected ? (
                      <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                        <Check className="h-4 w-4 text-primary-foreground" />
                      </div>
                    ) : (
                      <div className="h-6 w-6 rounded-full border-2 border-muted-foreground/30" />
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Selected collections badges */}
          {selectedCollections.size > 0 && (
            <div className="pt-4 border-t">
              <p className="text-sm font-medium mb-2">Selected Collections:</p>
              <div className="flex flex-wrap gap-2">
                {Array.from(selectedCollections).map((id) => {
                  const collection = collections.find((c) => c.id === id);
                  return collection ? (
                    <Badge key={id} variant="secondary">
                      {collection.name}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleCollection(id);
                        }}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ) : null;
                })}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
