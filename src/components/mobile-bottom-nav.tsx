"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { BookOpen, FolderOpen, Plus } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export default function MobileBottomNav() {
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === "/recipes") {
      return pathname === "/recipes" || pathname.startsWith("/recipes/");
    }
    if (path === "/collections") {
      return (
        pathname === "/collections" || pathname.startsWith("/collections/")
      );
    }
    return false;
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t md:hidden">
      <div className="flex items-center justify-around h-16 px-4">
        {/* Recipes */}
        <Link
          href="/recipes"
          className={cn(
            "flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-lg transition-colors",
            isActive("/recipes")
              ? "text-primary"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <BookOpen className="h-5 w-5" />
          <span className="text-xs font-medium">Recipes</span>
        </Link>

        {/* New Recipe - Centered and larger */}
        <Link
          href="/recipes/new"
          className="flex flex-col items-center justify-center -mt-6"
        >
          <div className="bg-primary text-primary-foreground rounded-full p-3 shadow-lg hover:bg-primary/90 transition-colors">
            <Plus className="h-6 w-6" />
          </div>
          <span className="text-xs font-medium text-primary mt-1">New</span>
        </Link>

        {/* Collections */}
        <Link
          href="/collections"
          className={cn(
            "flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-lg transition-colors",
            isActive("/collections")
              ? "text-primary"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <FolderOpen className="h-5 w-5" />
          <span className="text-xs font-medium">Collections</span>
        </Link>
      </div>
    </nav>
  );
}
