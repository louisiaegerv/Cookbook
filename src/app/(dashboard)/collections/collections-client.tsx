"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import CollectionCard from "@/components/ui/collection-card";
import { CollectionWithRecipes } from "@/lib/types/collection";

interface CollectionsClientProps {
  collections: CollectionWithRecipes[];
}

export default function CollectionsClient({
  collections: initialCollections,
}: CollectionsClientProps) {
  const [collections, setCollections] =
    useState<CollectionWithRecipes[]>(initialCollections);
  const router = useRouter();

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
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
      {collections.map((collection) => (
        <CollectionCard
          key={collection.id}
          collection={collection}
          onDelete={handleDelete}
        />
      ))}
    </div>
  );
}
