import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

// Rate limiting store (in-memory, consider Redis for production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 5; // More restrictive for AI API calls

// TypeScript interfaces for request and response
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

interface ParseRequest {
  videoData: TikTokVideoData;
}

interface ParseResponse {
  success: boolean;
  data?: ParsedRecipeData;
  error?: string;
}

// OpenRouter API configuration
const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    "X-Title": "Cookbook App",
  },
});

// Rate limiting middleware
function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const record = rateLimitStore.get(identifier);

  if (!record || now > record.resetTime) {
    rateLimitStore.set(identifier, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW,
    });
    return true;
  }

  if (record.count >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }

  record.count++;
  return true;
}

// Validate TikTok video data structure
function isValidTikTokVideoData(data: any): data is TikTokVideoData {
  return (
    data &&
    typeof data === "object" &&
    data.author &&
    typeof data.author === "object" &&
    typeof data.author.uniqueId === "string" &&
    typeof data.author.avatarThumb === "string" &&
    typeof data.author.nickname === "string" &&
    Array.isArray(data.suggestedWords) &&
    typeof data.description === "string" &&
    typeof data.coverUrl === "string" &&
    typeof data.dynamicCoverUrl === "string" &&
    typeof data.videoUrl === "string" &&
    typeof data.videoId === "string"
  );
}

// Create AI prompt for recipe parsing
function createRecipeParsingPrompt(videoData: TikTokVideoData): string {
  const { description, suggestedWords, author } = videoData;

  return `You are a professional recipe parser. Your task is to extract structured recipe information from a TikTok video description.

TikTok Video Description:
${description}

Suggested Words/Tags from TikTok:
${suggestedWords.join(", ")}

Author: @${author.uniqueId} (${author.nickname})

Please extract and return ONLY a valid JSON object with the following structure:
{
  "title": "Recipe title (create a descriptive title if not explicitly stated)",
  "description": "Brief description of the recipe",
  "ingredients": [
    {
      "name": "ingredient name",
      "quantity": "quantity (e.g., '2', '1/2', 'to taste')",
      "unit": "unit (e.g., 'cups', 'tbsp', 'pieces')"
    }
  ],
  "instructions": [
    "Step 1: instruction text",
    "Step 2: instruction text"
  ],
  "prepTime": "prep time (e.g., '15 minutes', '30 mins')",
  "cookTime": "cook time (e.g., '20 minutes', '1 hour')",
  "servings": number of servings,
  "tags": ["tag1", "tag2", "tag3"],
  "notes": "Additional notes including credit to TikTok creator"
}

Guidelines:
1. Extract as much recipe information as possible from the description
2. If information is missing, leave the field null or empty array
3. For ingredients, separate quantity and unit when possible
4. Convert time formats to be consistent (e.g., "15 minutes", "1 hour 30 mins")
5. Use the suggested words as hints for relevant tags
6. Include credit to the TikTok creator (@${author.uniqueId}) in the notes
7. If the description doesn't contain a recipe, still try to extract any food-related information
8. Return ONLY the JSON object, no additional text or explanation
9. Ensure the JSON is valid and properly formatted

Example of expected output format:
{
  "title": "Easy Chocolate Chip Cookies",
  "description": "Delicious homemade chocolate chip cookies that are soft and chewy",
  "ingredients": [
    {"name": "flour", "quantity": "2", "unit": "cups"},
    {"name": "sugar", "quantity": "1", "unit": "cup"},
    {"name": "chocolate chips", "quantity": "1", "unit": "cup"}
  ],
  "instructions": [
    "Preheat oven to 350°F",
    "Mix dry ingredients in a bowl",
    "Add wet ingredients and mix until combined",
    "Fold in chocolate chips",
    "Bake for 10-12 minutes until golden brown"
  ],
  "prepTime": "15 minutes",
  "cookTime": "12 minutes",
  "servings": 24,
  "tags": ["cookies", "dessert", "baking", "chocolate"],
  "notes": "Recipe credit: @${author.uniqueId} on TikTok"
}

Return ONLY the JSON object.`;
}

// Call OpenRouter API for recipe parsing
async function callOpenRouterApi(prompt: string): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not configured");
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "openai/gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a professional recipe parser. Always respond with valid JSON only.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 2000,
      response_format: { type: "json_object" },
    });

    if (!completion.choices || completion.choices.length === 0) {
      throw new Error("No response from OpenRouter API");
    }

    return completion.choices[0].message.content || "";
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to call OpenRouter API: ${error.message}`);
    }
    throw new Error("Failed to call OpenRouter API: Unknown error");
  }
}

// Parse and validate AI response
function parseAIResponse(aiResponse: string): ParsedRecipeData {
  try {
    // Try to extract JSON from the response (in case there's extra text)
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    const jsonString = jsonMatch ? jsonMatch[0] : aiResponse;

    const parsedData = JSON.parse(jsonString);

    // Validate and structure the response
    return {
      title: parsedData.title || "Untitled Recipe",
      description: parsedData.description || "",
      ingredients: Array.isArray(parsedData.ingredients)
        ? parsedData.ingredients.map((ing: any) => ({
            name: ing.name || "",
            quantity: ing.quantity || "",
            unit: ing.unit || "",
          }))
        : [],
      instructions: Array.isArray(parsedData.instructions)
        ? parsedData.instructions
        : [],
      prepTime: parsedData.prepTime || undefined,
      cookTime: parsedData.cookTime || undefined,
      servings: parsedData.servings || undefined,
      tags: Array.isArray(parsedData.tags) ? parsedData.tags : [],
      notes: parsedData.notes || "",
    };
  } catch (error) {
    throw new Error(
      `Failed to parse AI response: ${
        error instanceof Error ? error.message : "Invalid JSON"
      }`
    );
  }
}

// Main API route handler
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body: ParseRequest = await request.json();
    const { videoData } = body;

    // Validate request body
    if (!videoData) {
      return NextResponse.json(
        {
          success: false,
          error: "videoData is required",
        } as ParseResponse,
        { status: 400 }
      );
    }

    // Validate TikTok video data structure
    if (!isValidTikTokVideoData(videoData)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid TikTok video data structure",
        } as ParseResponse,
        { status: 400 }
      );
    }

    // Rate limiting
    const clientIp =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "unknown";
    if (!checkRateLimit(clientIp)) {
      return NextResponse.json(
        {
          success: false,
          error: "Rate limit exceeded. Please try again later.",
        } as ParseResponse,
        { status: 429 }
      );
    }

    // Create AI prompt
    const prompt = createRecipeParsingPrompt(videoData);

    // Call OpenRouter API
    const aiResponse = await callOpenRouterApi(prompt);

    // Parse AI response
    const parsedRecipe = parseAIResponse(aiResponse);

    // Return success response
    return NextResponse.json(
      {
        success: true,
        data: parsedRecipe,
      } as ParseResponse,
      { status: 200 }
    );
  } catch (error) {
    console.error("TikTok recipe parsing error:", error);

    // Return error response
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "An unknown error occurred",
      } as ParseResponse,
      { status: 500 }
    );
  }
}

// Handle GET requests with query parameter
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const description = searchParams.get("description");
    const suggestedWords = searchParams.get("suggestedWords");
    const authorName = searchParams.get("authorName");
    const authorHandle = searchParams.get("authorHandle");

    if (!description) {
      return NextResponse.json(
        {
          success: false,
          error: "description query parameter is required",
        } as ParseResponse,
        { status: 400 }
      );
    }

    // Create mock video data from query parameters
    const videoData: TikTokVideoData = {
      author: {
        uniqueId: authorHandle || "unknown",
        avatarThumb: "",
        nickname: authorName || "Unknown",
      },
      suggestedWords: suggestedWords ? suggestedWords.split(",") : [],
      description,
      coverUrl: "",
      dynamicCoverUrl: "",
      videoUrl: "",
      videoId: "",
    };

    // Reuse the POST logic by creating a mock request
    const mockRequest = new Request(request.url, {
      method: "POST",
      body: JSON.stringify({ videoData }),
    });

    return POST(mockRequest as NextRequest);
  } catch (error) {
    console.error("TikTok recipe parsing error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "An unknown error occurred",
      } as ParseResponse,
      { status: 500 }
    );
  }
}
