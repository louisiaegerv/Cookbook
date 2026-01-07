"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { X, Plus, Tag as TagIcon, Loader2, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Tag } from "@/lib/types/recipe";

interface BulkTagManagerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipeIds: string[];
  onTagsUpdated?: () => void;
}

export default function BulkTagManagerModal({
  open,
  onOpenChange,
  recipeIds,
  onTagsUpdated,
}: BulkTagManagerModalProps) {
  const [tags, setTags] = useState<Set<string>>(new Set());
  const [newTagName, setNewTagName] = useState("");
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const supabase = createClient();

  // Fetch all user tags when modal opens
  useEffect(() => {
    if (open) {
      fetchAllTags();
    }
  }, [open]);

  // Reset tags when modal closes
  useEffect(() => {
    if (!open) {
      setTags(new Set());
      setNewTagName("");
    }
  }, [open]);

  const fetchAllTags = async () => {
    setIsLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data } = await supabase
        .from("tags")
        .select("*")
        .eq("user_id", user.id)
        .order("name", { ascending: true });

      if (data) {
        setAllTags(data);
      }
    }
    setIsLoading(false);
  };

  const handleAddTag = async () => {
    if (!newTagName.trim()) return;

    const trimmedName = newTagName.trim().toLowerCase();

    // Check if tag already exists in user's tags
    const existingTag = allTags.find(
      (t) => t.name.toLowerCase() === trimmedName
    );

    let tagToAdd: Tag;

    if (existingTag) {
      tagToAdd = existingTag;
    } else {
      // Create new tag
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data: newTag } = await supabase
        .from("tags")
        .insert({
          user_id: user.id,
          name: trimmedName,
          color: "#10b981", // Default green color
        })
        .select()
        .single();

      if (newTag) {
        tagToAdd = newTag;
        setAllTags([...allTags, newTag]);
      } else {
        return;
      }
    }

    // Add to selected tags
    const newTags = new Set(tags);
    newTags.add(tagToAdd.id);
    setTags(newTags);
    setNewTagName("");
  };

  const handleToggleTag = (tagId: string) => {
    const newTags = new Set(tags);
    if (newTags.has(tagId)) {
      newTags.delete(tagId);
    } else {
      newTags.add(tagId);
    }
    setTags(newTags);
  };

  const handleSave = async () => {
    if (tags.size === 0) {
      onOpenChange(false);
      return;
    }

    setIsSaving(true);

    try {
      // Add selected tags to all selected recipes
      const recipeTagsToInsert = [];
      for (const recipeId of recipeIds) {
        for (const tagId of tags) {
          recipeTagsToInsert.push({
            recipe_id: recipeId,
            tag_id: tagId,
          });
        }
      }

      // Insert all recipe-tag relationships
      const { error } = await supabase
        .from("recipe_tags")
        .insert(recipeTagsToInsert)
        .select();

      if (error) {
        // Check if it's a duplicate key error (which is fine)
        if (!error.message.includes("duplicate")) {
          throw error;
        }
      }

      onTagsUpdated?.();
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving tags:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <TagIcon className="h-4 w-4 sm:h-5 sm:w-5" />
            Add Tags to {recipeIds.length} Recipe
            {recipeIds.length > 1 ? "s" : ""}
          </DialogTitle>
          <DialogDescription className="text-sm sm:text-base">
            Select tags to add to the selected recipes
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Add new tag */}
          <div className="space-y-2">
            <Label htmlFor="new-tag">Create New Tag</Label>
            <div className="flex gap-2">
              <Input
                id="new-tag"
                placeholder="Enter tag name..."
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isSaving}
              />
              <Button
                onClick={handleAddTag}
                disabled={!newTagName.trim() || isSaving}
                type="button"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {/* Suggest existing tags */}
            {newTagName && allTags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {allTags
                  .filter(
                    (tag) =>
                      tag.name
                        .toLowerCase()
                        .includes(newTagName.toLowerCase()) && !tags.has(tag.id)
                  )
                  .slice(0, 5)
                  .map((tag) => (
                    <Badge
                      key={tag.id}
                      variant="outline"
                      className="cursor-pointer hover:bg-accent"
                      onClick={() => {
                        const newTags = new Set(tags);
                        newTags.add(tag.id);
                        setTags(newTags);
                        setNewTagName("");
                      }}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      {tag.name}
                    </Badge>
                  ))}
              </div>
            )}
          </div>

          {/* All tags */}
          <div className="space-y-2">
            <Label>Select Tags</Label>
            {allTags.length === 0 ? (
              <p className="text-xs sm:text-sm text-muted-foreground">
                No tags yet. Create one above to get started.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {allTags.map((tag) => {
                  const isSelected = tags.has(tag.id);
                  return (
                    <Badge
                      key={tag.id}
                      variant={isSelected ? "default" : "outline"}
                      className={`gap-1 pr-2 cursor-pointer transition-all ${
                        isSelected ? "ring-2 ring-primary" : ""
                      }`}
                      style={
                        isSelected
                          ? {
                              backgroundColor: tag.color,
                              color: "white",
                            }
                          : {
                              backgroundColor: `${tag.color}20`,
                              borderColor: tag.color,
                            }
                      }
                      onClick={() => handleToggleTag(tag.id)}
                    >
                      <span className="flex items-center gap-1">
                        <TagIcon
                          className="h-3 w-3"
                          style={{ color: isSelected ? "white" : tag.color }}
                        />
                        {tag.name}
                      </span>
                      {isSelected && <Check className="h-3 w-3" />}
                    </Badge>
                  );
                })}
              </div>
            )}
          </div>

          {/* Selected tags summary */}
          {tags.size > 0 && (
            <div className="pt-2 border-t">
              <p className="text-sm font-medium mb-2">
                {tags.size} tag{tags.size > 1 ? "s" : ""} selected
              </p>
              <div className="flex flex-wrap gap-2">
                {Array.from(tags).map((tagId) => {
                  const tag = allTags.find((t) => t.id === tagId);
                  return tag ? (
                    <Badge
                      key={tag.id}
                      variant="secondary"
                      className="gap-1 pr-2"
                      style={{
                        backgroundColor: `${tag.color}20`,
                        borderColor: tag.color,
                      }}
                    >
                      <span className="flex items-center gap-1">
                        <TagIcon
                          className="h-3 w-3"
                          style={{ color: tag.color }}
                        />
                        {tag.name}
                      </span>
                      <button
                        onClick={() => handleToggleTag(tag.id)}
                        disabled={isSaving}
                        className="ml-1 hover:bg-accent rounded-full p-0.5 transition-colors"
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
            disabled={isSaving || tags.size === 0}
            className="w-full sm:w-auto"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Adding Tags...
              </>
            ) : (
              `Add Tags to ${recipeIds.length} Recipe${
                recipeIds.length > 1 ? "s" : ""
              }`
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
