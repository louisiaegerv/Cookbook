/**
 * Example usage of the TikTok Recipe Parser API
 *
 * This file demonstrates how to use the parse API endpoint with various
 * TikTok video data formats.
 *
 * The API uses OpenRouter with the openai/gpt-4o-mini model for
 * cost-effective and accurate recipe parsing.
 */

import React from "react";

// Example 1: Well-structured recipe description
const wellStructuredRecipe = {
  videoData: {
    author: {
      uniqueId: "chefjohn",
      avatarThumb: "https://example.com/avatar.jpg",
      nickname: "Chef John",
    },
    suggestedWords: ["pasta", "recipe", "cooking", "italian", "homemade"],
    description: `Here is my amazing homemade pasta recipe! 🍝

Ingredients:
• 2 cups all-purpose flour
• 3 large eggs
• 1 tbsp olive oil
• 1/2 tsp salt

Instructions:
1. Create a well in the flour and crack eggs into it
2. Mix with a fork until dough forms
3. Knead for 10 minutes until smooth
4. Wrap in plastic and rest for 30 minutes
5. Roll out thin and cut into desired shape
6. Cook in boiling salted water for 3-4 minutes
7. Serve with your favorite sauce!

Prep time: 15 mins
Cook time: 4 mins
Servings: 4

#pasta #homemade #italian #cooking #recipe`,
    coverUrl: "https://example.com/cover.jpg",
    dynamicCoverUrl: "https://example.com/dynamic.jpg",
    videoUrl: "https://example.com/video.mp4",
    videoId: "123456789",
  },
};

// Example 2: Casual/informal recipe description
const casualRecipe = {
  videoData: {
    author: {
      uniqueId: "quickbites",
      avatarThumb: "https://example.com/avatar2.jpg",
      nickname: "Quick Bites",
    },
    suggestedWords: ["quick", "easy", "breakfast", "pancakes"],
    description: `Quick breakfast hack! 🥞

You need:
- 1 cup pancake mix
- 3/4 cup milk
- 1 egg
- Butter for pan

Just mix everything, cook on medium heat for 2 mins each side. Top with maple syrup and berries! So easy and delicious!

Perfect for busy mornings! #breakfast #pancakes #quickmeals #easyrecipes`,
    coverUrl: "https://example.com/cover2.jpg",
    dynamicCoverUrl: "https://example.com/dynamic2.jpg",
    videoUrl: "https://example.com/video2.mp4",
    videoId: "987654321",
  },
};

// Example 3: Minimal recipe information
const minimalRecipe = {
  videoData: {
    author: {
      uniqueId: "foodlover",
      avatarThumb: "https://example.com/avatar3.jpg",
      nickname: "Food Lover",
    },
    suggestedWords: ["salad", "healthy", "lunch"],
    description: `Simple salad for lunch! 🥗

Just mix: lettuce, tomatoes, cucumber, feta cheese, and olive oil. That's it! #healthy #salad #lunch`,
    coverUrl: "https://example.com/cover3.jpg",
    dynamicCoverUrl: "https://example.com/dynamic3.jpg",
    videoUrl: "https://example.com/video3.mp4",
    videoId: "456789123",
  },
};

// Example 4: Complex recipe with multiple steps
const complexRecipe = {
  videoData: {
    author: {
      uniqueId: "masterchef",
      avatarThumb: "https://example.com/avatar4.jpg",
      nickname: "Master Chef",
    },
    suggestedWords: ["beef", "stew", "comfort food", "dinner"],
    description: `Ultimate Beef Stew Recipe 🍲

Ingredients:
• 2 lbs beef chuck, cubed
• 4 cups beef broth
• 1 onion, diced
• 3 carrots, sliced
• 3 potatoes, cubed
• 2 celery stalks, chopped
• 3 cloves garlic, minced
• 2 tbsp tomato paste
• 1/4 cup flour
• 2 tbsp olive oil
• 1 tsp thyme
• 1 tsp rosemary
• Salt and pepper to taste

Instructions:
1. Season beef with salt and pepper, coat in flour
2. Brown beef in olive oil (in batches)
3. Remove beef, sauté onions and garlic
4. Add tomato paste, cook 2 minutes
5. Deglaze with 1 cup broth
6. Return beef to pot, add remaining broth
7. Bring to boil, reduce heat, simmer 1.5 hours
8. Add carrots, celery, and potatoes
9. Simmer another 45 minutes until vegetables are tender
10. Stir in herbs, adjust seasoning
11. Let rest 10 minutes before serving

Prep: 20 mins
Cook: 2 hours 15 mins
Servings: 6

Perfect for cold nights! #beefstew #comfortfood #dinner #slowcooking`,
    coverUrl: "https://example.com/cover4.jpg",
    dynamicCoverUrl: "https://example.com/dynamic4.jpg",
    videoUrl: "https://example.com/video4.mp4",
    videoId: "321654987",
  },
};

/**
 * Function to test the parse API with example data
 */
async function testParseAPI(exampleData: any) {
  try {
    const response = await fetch("/api/tiktok/parse", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(exampleData),
    });

    const result = await response.json();

    if (result.success) {
      console.log("✅ Successfully parsed recipe:");
      console.log("Title:", result.data.title);
      console.log("Ingredients:", result.data.ingredients.length);
      console.log("Instructions:", result.data.instructions.length);
      console.log("Tags:", result.data.tags);
      return result.data;
    } else {
      console.error("❌ Failed to parse recipe:", result.error);
      return null;
    }
  } catch (error) {
    console.error("❌ Error calling parse API:", error);
    return null;
  }
}

/**
 * Example: Using the parse API in a Next.js component
 */
export async function TikTokRecipeParser() {
  // This would typically come from the scrape endpoint
  const videoData = wellStructuredRecipe.videoData;

  const response = await fetch("/api/tiktok/parse", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ videoData }),
  });

  const result = await response.json();

  if (!result.success) {
    return <div>Error: {result.error}</div>;
  }

  const recipe = result.data;

  return (
    <div className="recipe-container">
      <h1>{recipe.title}</h1>
      <p className="description">{recipe.description}</p>

      <div className="meta-info">
        {recipe.prepTime && <span>⏱️ Prep: {recipe.prepTime}</span>}
        {recipe.cookTime && <span>🍳 Cook: {recipe.cookTime}</span>}
        {recipe.servings && <span>👥 Serves: {recipe.servings}</span>}
      </div>

      <div className="tags">
        {recipe.tags.map((tag: string) => (
          <span key={tag} className="tag">
            #{tag}
          </span>
        ))}
      </div>

      <h2>Ingredients</h2>
      <ul className="ingredients">
        {recipe.ingredients.map((ingredient: any, index: number) => (
          <li key={index}>
            {ingredient.quantity && <span>{ingredient.quantity} </span>}
            {ingredient.unit && <span>{ingredient.unit} </span>}
            <span>{ingredient.name}</span>
          </li>
        ))}
      </ul>

      <h2>Instructions</h2>
      <ol className="instructions">
        {recipe.instructions.map((instruction: string, index: number) => (
          <li key={index}>{instruction}</li>
        ))}
      </ol>

      {recipe.notes && (
        <div className="notes">
          <h3>Notes</h3>
          <p>{recipe.notes}</p>
        </div>
      )}
    </div>
  );
}

/**
 * Example: Integrating with existing recipe form
 */
export function populateRecipeFormFromTikTok(parsedData: any, form: any): void {
  // Set basic fields
  form.setValue("title", parsedData.title);
  form.setValue("description", parsedData.description);
  form.setValue("prepTime", parsedData.prepTime || "");
  form.setValue("cookTime", parsedData.cookTime || "");
  form.setValue("servings", parsedData.servings || "");
  form.setValue("tags", parsedData.tags.join(", "));
  form.setValue("notes", parsedData.notes || "");

  // Clear existing ingredients and add new ones
  form.setValue("ingredients", []);
  parsedData.ingredients.forEach((ingredient: any, index: number) => {
    form.setValue(`ingredients.${index}.name`, ingredient.name);
    form.setValue(`ingredients.${index}.quantity`, ingredient.quantity || "");
    form.setValue(`ingredients.${index}.unit`, ingredient.unit || "");
  });

  // Clear existing instructions and add new ones
  form.setValue("instructions", []);
  parsedData.instructions.forEach((instruction: string, index: number) => {
    form.setValue(`instructions.${index}`, instruction);
  });
}

/**
 * Example: Complete workflow from TikTok URL to saved recipe
 */
export async function importRecipeFromTikTok(tiktokUrl: string) {
  try {
    // Step 1: Scrape TikTok data
    const scrapeResponse = await fetch("/api/tiktok/scrape", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: tiktokUrl }),
    });

    const scrapeResult = await scrapeResponse.json();

    if (!scrapeResult.success) {
      throw new Error(scrapeResult.error || "Failed to scrape TikTok");
    }

    // Step 2: Parse recipe from TikTok data
    const parseResponse = await fetch("/api/tiktok/parse", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ videoData: scrapeResult.data }),
    });

    const parseResult = await parseResponse.json();

    if (!parseResult.success) {
      throw new Error(parseResult.error || "Failed to parse recipe");
    }

    // Step 3: Return parsed recipe for user review
    return {
      success: true,
      tiktokData: scrapeResult.data,
      recipe: parseResult.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Export examples for testing
export {
  wellStructuredRecipe,
  casualRecipe,
  minimalRecipe,
  complexRecipe,
  testParseAPI,
};
