import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { Button } from "@/components/ui/button";
import { BookOpen, Utensils, Tag, FolderOpen } from "lucide-react";

export default async function Home() {
  // Check for user session
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Redirect signed-in users to recipes page
  if (session) {
    redirect("/recipes");
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b">
        <div className="container mx-auto px-4 py-3 sm:py-4 flex justify-between items-center">
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <BookOpen className="h-5 w-5 sm:h-6 sm:w-6" />
            Cookbook
          </h1>
          <div className="flex gap-2">
            {session ? (
              <Link href="/recipes/new">
                <Button size="sm">Create Recipe</Button>
              </Link>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm">
                    Login
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button size="sm">Sign Up</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="py-12 sm:py-16 md:py-20 px-4">
          <div className="container mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6">
              Your Personal Recipe Collection
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground mb-6 sm:mb-8 max-w-2xl mx-auto">
              Organize your favorite recipes with images, tags, and collections.
              Never lose a recipe again.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              {session ? (
                <Link href="/recipes/new" className="w-full sm:w-auto">
                  <Button size="lg" className="w-full sm:w-auto">
                    Create Recipe
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/signup" className="w-full sm:w-auto">
                    <Button size="lg" className="w-full sm:w-auto">
                      Get Started Free
                    </Button>
                  </Link>
                  <Link href="/login" className="w-full sm:w-auto">
                    <Button
                      size="lg"
                      variant="outline"
                      className="w-full sm:w-auto"
                    >
                      Sign In
                    </Button>
                  </Link>
                </>
              )}
              <Link href="/recipes" className="w-full sm:w-auto">
                <Button size="lg" variant="ghost" className="w-full sm:w-auto">
                  Browse Recipes
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <section className="py-12 sm:py-16 md:py-20 px-4 bg-muted/50">
          <div className="container mx-auto">
            <h3 className="text-2xl sm:text-3xl font-bold text-center mb-8 sm:mb-12">
              Features
            </h3>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
              <div className="text-center">
                <div className="bg-primary/10 p-3 sm:p-4 rounded-full w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <Utensils className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                </div>
                <h4 className="text-lg sm:text-xl font-semibold mb-2">
                  Rich Recipe Details
                </h4>
                <p className="text-sm sm:text-base text-muted-foreground">
                  Add ingredients, instructions, cooking time, and unlimited
                  images to your recipes
                </p>
              </div>
              <div className="text-center">
                <div className="bg-primary/10 p-3 sm:p-4 rounded-full w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <Tag className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                </div>
                <h4 className="text-lg sm:text-xl font-semibold mb-2">
                  Smart Organization
                </h4>
                <p className="text-sm sm:text-base text-muted-foreground">
                  Use tags, categories, and custom collections to organize your
                  recipes
                </p>
              </div>
              <div className="text-center">
                <div className="bg-primary/10 p-3 sm:p-4 rounded-full w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <FolderOpen className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                </div>
                <h4 className="text-lg sm:text-xl font-semibold mb-2">
                  Quick Search
                </h4>
                <p className="text-sm sm:text-base text-muted-foreground">
                  Search by title or ingredients, filter by tags and categories
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-4 sm:py-6 px-4">
        <div className="container mx-auto text-center text-xs sm:text-sm text-muted-foreground">
          <p>© 2024 Cookbook. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
