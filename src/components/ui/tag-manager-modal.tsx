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
import { X, Plus, Tag as TagIcon, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Tag } from "@/lib/types/recipe";

interface TagManagerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipeId: string;
  currentTags: Tag[];
  onTagsUpdated: (tags: Tag[]) => void;
}

export default function TagManagerModal({
  open,
  onOpenChange,
  recipeId,
  currentTags,
  onTagsUpdated,
}: TagManagerModalProps) {
  const [tags, setTags] = useState<Tag[]>(currentTags);
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

    // Check if recipe already has this tag
    if (tags.some((t) => t.id === tagToAdd.id)) {
      setNewTagName("");
      return;
    }

    setTags([...tags, tagToAdd]);
    setNewTagName("");
  };

  const handleRemoveTag = (tagId: string) => {
    setTags(tags.filter((t) => t.id !== tagId));
  };

  const handleSave = async () => {
    setIsSaving(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setIsSaving(false);
      return;
    }

    try {
      // Get current recipe tags
      const { data: existingRecipeTags } = await supabase
        .from("recipe_tags")
        .select("tag_id")
        .eq("recipe_id", recipeId);

      const existingTagIds = existingRecipeTags?.map((rt) => rt.tag_id) || [];
      const newTagIds = tags.map((t) => t.id);

      // Tags to add
      const tagsToAdd = newTagIds.filter((id) => !existingTagIds.includes(id));

      // Tags to remove
      const tagsToRemove = existingTagIds.filter(
        (id) => !newTagIds.includes(id)
      );

      // Remove old tags
      if (tagsToRemove.length > 0) {
        await supabase
          .from("recipe_tags")
          .delete()
          .eq("recipe_id", recipeId)
          .in("tag_id", tagsToRemove);
      }

      // Add new tags
      if (tagsToAdd.length > 0) {
        const recipeTagsToInsert = tagsToAdd.map((tagId) => ({
          recipe_id: recipeId,
          tag_id: tagId,
        }));

        await supabase.from("recipe_tags").insert(recipeTagsToInsert);
      }

      onTagsUpdated(tags);
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
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TagIcon className="h-5 w-5" />
            Manage Tags
          </DialogTitle>
          <DialogDescription>
            Add or remove tags to organize your recipes
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Add new tag */}
          <div className="space-y-2">
            <Label htmlFor="new-tag">Add Tag</Label>
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
                        .includes(newTagName.toLowerCase()) &&
                      !tags.some((t) => t.id === tag.id)
                  )
                  .slice(0, 5)
                  .map((tag) => (
                    <Badge
                      key={tag.id}
                      variant="outline"
                      className="cursor-pointer hover:bg-accent"
                      onClick={() => {
                        setTags([...tags, tag]);
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

          {/* Current tags */}
          <div className="space-y-2">
            <Label>Current Tags</Label>
            {tags.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No tags added yet. Add tags above to get started.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
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
                      onClick={() => handleRemoveTag(tag.id)}
                      disabled={isSaving}
                      className="ml-1 hover:bg-accent rounded-full p-0.5 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
