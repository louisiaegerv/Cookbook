import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CollectionForm from "./collection-form";

export default async function NewCollectionPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen">
      <div className="container mx-auto py-6 px-4 max-w-2xl sm:py-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8">
          Create New Collection
        </h1>
        <CollectionForm />
      </div>
    </div>
  );
}
