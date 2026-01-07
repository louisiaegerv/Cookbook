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
import { Plus, X, Check, Loader2 } from "lucide-react";

interface BulkCollectionManagerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipeIds: string[];
  onCollectionsUpdated?: () => void;
}

export default function BulkCollectionManagerModal({
  open,
  onOpenChange,
  recipeIds,
  onCollectionsUpdated,
}: BulkCollectionManagerModalProps) {
  const supabase = createClient();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedCollections, setSelectedCollections] = useState<Set<string>>(
    new Set()
  );
  const [newCollectionName, setNewCollectionName] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open) {
      fetchCollections();
    }
  }, [open]);

  // Reset selections when modal closes
  useEffect(() => {
    if (!open) {
      setSelectedCollections(new Set());
      setNewCollectionName("");
    }
  }, [open]);

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
    } catch (error) {
      console.error("Error creating collection:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleCollection = (collectionId: string) => {
    const newSelected = new Set(selectedCollections);
    if (newSelected.has(collectionId)) {
      newSelected.delete(collectionId);
    } else {
      newSelected.add(collectionId);
    }
    setSelectedCollections(newSelected);
  };

  const handleSave = async () => {
    if (selectedCollections.size === 0) {
      onOpenChange(false);
      return;
    }

    setIsSaving(true);

    try {
      // Add all selected recipes to all selected collections
      const recipeCollectionsToInsert = [];
      for (const recipeId of recipeIds) {
        for (const collectionId of selectedCollections) {
          recipeCollectionsToInsert.push({
            recipe_id: recipeId,
            collection_id: collectionId,
          });
        }
      }

      // Insert all recipe-collection relationships
      const { error } = await supabase
        .from("recipe_collections")
        .insert(recipeCollectionsToInsert)
        .select();

      if (error) {
        // Check if it's a duplicate key error (which is fine)
        if (!error.message.includes("duplicate")) {
          throw error;
        }
      }

      onCollectionsUpdated?.();
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating collections:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            Add to Collections ({recipeIds.length} recipe
            {recipeIds.length > 1 ? "s" : ""})
          </DialogTitle>
          <DialogDescription>
            Select collections to add the selected recipes to
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
                disabled={loading || isSaving}
              />
            </div>
            <Button
              type="submit"
              size="icon"
              disabled={loading || isSaving || !newCollectionName.trim()}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
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
                    className={`flex items-center justify-between p-3 rounded-lg border transition-colors cursor-pointer ${
                      isSelected
                        ? "bg-primary/10 border-primary"
                        : "hover:bg-muted/50"
                    }`}
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
              <p className="text-sm font-medium mb-2">
                {selectedCollections.size} collection
                {selectedCollections.size > 1 ? "s" : ""} selected
              </p>
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
                        disabled={isSaving}
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

        <div className="flex flex-col sm:flex-row justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || selectedCollections.size === 0}
            className="w-full sm:w-auto"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Adding...
              </>
            ) : (
              `Add to ${selectedCollections.size} Collection${
                selectedCollections.size > 1 ? "s" : ""
              }`
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
