import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import RecipeForm from "./recipe-form";

export default async function NewRecipePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>Please sign in to create a recipe</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/login">
              <button className="w-full">Sign In</button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="border-b bg-background">
        <div className="container mx-auto px-4 py-3 sm:py-4 flex items-center">
          <Link href="/recipes">
            <button className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-muted transition-colors text-sm sm:text-base">
              <ArrowLeft className="h-4 w-4" />
              Back to Recipes
            </button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto py-6 px-4 sm:py-8">
        <Card>
          <CardHeader>
            <CardTitle>Create New Recipe</CardTitle>
            <CardDescription>
              Fill in the details for your recipe
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RecipeForm />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
