# TikTok Recipe Parser API

This API endpoint uses OpenRouter (a unified AI API gateway) to parse TikTok video data into structured recipe information.

## Overview

The parse endpoint accepts TikTok video data (typically obtained from the scrape endpoint) and uses AI to extract structured recipe information including title, ingredients, instructions, cooking times, servings, tags, and more.

OpenRouter provides access to hundreds of AI models through a single OpenAI-compatible API endpoint. We use the `openai/gpt-4o-mini` model for cost-effective and accurate recipe parsing.

## Endpoint

- **URL**: `/api/tiktok/parse`
- **Methods**: `POST`, `GET`

## Authentication

The API requires an `OPENROUTER_API_KEY` environment variable to be configured. Add this to your `.env` file:

```env
OPENROUTER_API_KEY=your_openrouter_api_key_here
```

### Getting an OpenRouter API Key

1. Visit [OpenRouter.ai](https://openrouter.ai/)
2. Sign up for an account
3. Navigate to the API Keys section
4. Generate a new API key
5. Add the key to your `.env` file as shown above

### Supported Models

The API uses `openai/gpt-4o-mini` by default, which provides:

- Fast response times
- Cost-effective pricing
- Excellent JSON output quality
- Strong understanding of recipe content

You can modify the model in [`route.ts`](route.ts) by changing the `model` parameter in the `callOpenRouterApi` function. Popular alternatives include:

- `anthropic/claude-3-haiku` - Fast and cost-effective
- `openai/gpt-4o` - Higher accuracy, slightly more expensive
- `google/gemini-flash-1.5` - Fast with good performance

## Request Format

### POST Request

Send a POST request with the TikTok video data in the request body:

```typescript
POST /api/tiktok/parse
Content-Type: application/json

{
  "videoData": {
    "author": {
      "uniqueId": "username",
      "avatarThumb": "https://...",
      "nickname": "Display Name"
    },
    "suggestedWords": ["recipe", "cooking", "food"],
    "description": "Here's how to make delicious pasta! 🍝\n\nIngredients:\n- 2 cups flour\n- 3 eggs\n- 1 tbsp olive oil\n\nInstructions:\n1. Mix flour and eggs\n2. Knead for 10 minutes\n3. Roll out and cut\n4. Cook in boiling water for 3-4 minutes",
    "coverUrl": "https://...",
    "dynamicCoverUrl": "https://...",
    "videoUrl": "https://...",
    "videoId": "123456789"
  }
}
```

### GET Request

You can also use GET with query parameters for quick testing:

```
GET /api/tiktok/parse?description=Recipe description here&suggestedWords=tag1,tag2,tag3&authorName=Display Name&authorHandle=username
```

## Response Format

### Success Response

```typescript
{
  "success": true,
  "data": {
    "title": "Homemade Pasta",
    "description": "Delicious homemade pasta made from scratch",
    "ingredients": [
      {
        "name": "flour",
        "quantity": "2",
        "unit": "cups"
      },
      {
        "name": "eggs",
        "quantity": "3",
        "unit": ""
      },
      {
        "name": "olive oil",
        "quantity": "1",
        "unit": "tbsp"
      }
    ],
    "instructions": [
      "Mix flour and eggs",
      "Knead for 10 minutes",
      "Roll out and cut",
      "Cook in boiling water for 3-4 minutes"
    ],
    "prepTime": "15 minutes",
    "cookTime": "4 minutes",
    "servings": 4,
    "tags": ["pasta", "homemade", "italian", "cooking"],
    "notes": "Recipe credit: @username on TikTok"
  }
}
```

### Error Response

```typescript
{
  "success": false,
  "error": "Error message describing what went wrong"
}
```

## TypeScript Types

### Request Types

```typescript
interface TikTokVideoData {
  author: {
    uniqueId: string;
    avatarThumb: string;
    nickname: string;
  };
  suggestedWords: string[];
  description: string;
  coverUrl: string;
  dynamicCoverUrl: string;
  videoUrl: string;
  videoId: string;
}

interface ParseRequest {
  videoData: TikTokVideoData;
}
```

### Response Types

```typescript
interface Ingredient {
  name: string;
  quantity?: string;
  unit?: string;
}

interface ParsedRecipeData {
  title: string;
  description: string;
  ingredients: Ingredient[];
  instructions: string[];
  prepTime?: string;
  cookTime?: string;
  servings?: number;
  tags: string[];
  notes?: string;
}

interface ParseResponse {
  success: boolean;
  data?: ParsedRecipeData;
  error?: string;
}
```

## Rate Limiting

The API implements rate limiting to prevent abuse:

- **Window**: 1 minute
- **Maximum Requests**: 5 requests per window per IP address

If the rate limit is exceeded, the API returns a `429 Too Many Requests` status.

## Error Handling

The API handles various error scenarios:

- **400 Bad Request**: Invalid request body or missing required fields
- **429 Too Many Requests**: Rate limit exceeded
- **500 Internal Server Error**: API errors, AI parsing failures, or unexpected errors

## AI Parsing Features

The AI parser is designed to:

1. **Extract structured information** from various TikTok description formats
2. **Handle incomplete data** - gracefully handles missing information
3. **Parse different time formats** - normalizes time representations
4. **Separate ingredients** - splits quantity, unit, and name
5. **Use suggested words** - leverages TikTok's suggested words as tag hints
6. **Credit creators** - automatically includes TikTok author credit in notes
7. **Handle casual formats** - works with both structured and informal recipe descriptions

## Usage Examples

### Example 1: Using with Scrape Endpoint

```typescript
// First, scrape TikTok data
const scrapeResponse = await fetch("/api/tiktok/scrape", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ url: "https://tiktok.com/@user/video/123" }),
});

const scrapeData = await scrapeResponse.json();

// Then parse the recipe
const parseResponse = await fetch("/api/tiktok/parse", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ videoData: scrapeData.data }),
});

const recipeData = await parseResponse.json();
```

### Example 2: Direct Integration in React Component

```typescript
import { useState } from "react";

function TikTokRecipeImporter({ videoData }: { videoData: TikTokVideoData }) {
  const [recipe, setRecipe] = useState<ParsedRecipeData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parseRecipe = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/tiktok/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoData }),
      });

      const data = await response.json();

      if (data.success) {
        setRecipe(data.data);
      } else {
        setError(data.error || "Failed to parse recipe");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button onClick={parseRecipe} disabled={loading}>
        {loading ? "Parsing..." : "Parse Recipe"}
      </button>

      {error && <div className="error">{error}</div>}

      {recipe && (
        <div className="recipe">
          <h2>{recipe.title}</h2>
          <p>{recipe.description}</p>
          {/* Display recipe data */}
        </div>
      )}
    </div>
  );
}
```

### Example 3: Using with cURL

```bash
# POST request with video data
curl -X POST http://localhost:3000/api/tiktok/parse \
  -H "Content-Type: application/json" \
  -d '{
    "videoData": {
      "author": {
        "uniqueId": "chefjohn",
        "avatarThumb": "https://example.com/avatar.jpg",
        "nickname": "Chef John"
      },
      "suggestedWords": ["pasta", "recipe", "cooking"],
      "description": "Here is my amazing pasta recipe! 🍝\n\nIngredients:\n- 2 cups flour\n- 3 eggs\n\nInstructions:\n1. Mix everything\n2. Cook and enjoy!",
      "coverUrl": "https://example.com/cover.jpg",
      "dynamicCoverUrl": "https://example.com/dynamic.jpg",
      "videoUrl": "https://example.com/video.mp4",
      "videoId": "123456789"
    }
  }'

# GET request with query parameters
curl "http://localhost:3000/api/tiktok/parse?description=Recipe%20description&authorName=Chef%20John&authorHandle=chefjohn"
```

## Integration with Recipe Form

The parsed data can be directly used to populate your recipe form:

```typescript
function populateRecipeForm(parsedData: ParsedRecipeData) {
  // Set form values
  form.setValue("title", parsedData.title);
  form.setValue("description", parsedData.description);
  form.setValue("prepTime", parsedData.prepTime || "");
  form.setValue("cookTime", parsedData.cookTime || "");
  form.setValue("servings", parsedData.servings || "");
  form.setValue("tags", parsedData.tags.join(", "));
  form.setValue("notes", parsedData.notes || "");

  // Set ingredients
  parsedData.ingredients.forEach((ingredient, index) => {
    form.setValue(`ingredients.${index}.name`, ingredient.name);
    form.setValue(`ingredients.${index}.quantity`, ingredient.quantity || "");
    form.setValue(`ingredients.${index}.unit`, ingredient.unit || "");
  });

  // Set instructions
  parsedData.instructions.forEach((instruction, index) => {
    form.setValue(`instructions.${index}`, instruction);
  });
}
```

## Best Practices

1. **Always validate the response** - Check `success` field before using the data
2. **Handle errors gracefully** - Provide user feedback when parsing fails
3. **Review parsed data** - AI parsing is not perfect, allow users to edit before saving
4. **Use rate limiting** - Respect the rate limits to avoid being blocked
5. **Secure your API key** - Never expose `ZAI_API_KEY` in client-side code
6. **Cache results** - Consider caching parsed recipes to reduce API calls

## Troubleshooting

### "OPENROUTER_API_KEY is not configured"

Ensure you've added the `OPENROUTER_API_KEY` to your `.env` file and restarted your development server.

### "Failed to call OpenRouter API"

This error can occur if:

- Your API key is invalid or expired
- You've exceeded your OpenRouter quota
- The OpenRouter service is experiencing issues

Check the OpenRouter dashboard for your API key status and usage.

### "Rate limit exceeded"

Wait for the rate limit window to reset (1 minute) before making additional requests.

### "Failed to parse AI response"

This can happen if the AI returns invalid JSON. The API includes error handling to extract JSON from responses with extra text.

### "Invalid TikTok video data structure"

Ensure the `videoData` object matches the expected structure with all required fields.

## Future Enhancements

Potential improvements for the API:

- Add support for batch parsing multiple videos
- Implement caching for frequently parsed recipes
- Add options for different AI models via query parameters
- Support for custom parsing prompts
- Add validation for parsed recipe data (e.g., checking for required fields)
- Implement retry logic for failed API calls with exponential backoff
- Add support for parsing from video transcripts (when available)
- Add streaming responses for faster UX
- Implement model fallback logic for better reliability

## OpenRouter Benefits

Using OpenRouter instead of z.ai provides several advantages:

1. **Model Flexibility**: Access to hundreds of AI models through a single API
2. **Cost Optimization**: Choose the best model for your use case and budget
3. **OpenAI Compatibility**: Use the familiar OpenAI SDK without code changes
4. **Transparent Pricing**: Clear pricing per model with no hidden fees
5. **Reliability**: Built-in load balancing and failover across providers
6. **Easy Migration**: Switch between models without changing your code
