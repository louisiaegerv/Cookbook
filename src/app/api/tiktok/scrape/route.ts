import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";

// Rate limiting store (in-memory, consider Redis for production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 10;

// TypeScript interfaces for TikTok data structure
interface TikUniversalData {
  __DEFAULT_SCOPE__: {
    "webapp.video-detail": {
      itemInfo: {
        itemStruct: TikTokVideoData;
      };
    };
  };
}

interface TikTokVideoData {
  id: string;
  desc: string;
  video: {
    cover: string;
    dynamicCover: string;
    PlayAddrStruct: {
      UrlList: string[];
    };
  };
  author: {
    uniqueId: string;
    avatarThumb: string;
    nickname: string;
  };
  suggestedWords: string[];
}

interface ScrapeResponse {
  success: boolean;
  data?: {
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
  };
  error?: string;
}

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

// Validate TikTok URL format
function isValidTikTokUrl(url: string): boolean {
  const tiktokUrlPatterns = [
    /^https?:\/\/(?:www\.)?tiktok\.com\/@[\w.-]+\/video\/[\d]+/,
    /^https?:\/\/(?:www\.)?tiktok\.com\/t\/[\w]+/,
    /^https?:\/\/(?:www\.)?tiktok\.com\/v\/[\d]+/,
  ];

  return tiktokUrlPatterns.some((pattern) => pattern.test(url));
}

// Extract video ID from TikTok URL
function extractVideoIdFromUrl(url: string): string | null {
  const patterns = [
    /tiktok\.com\/@[\w.-]+\/video\/([\d]+)/,
    /tiktok\.com\/v\/([\d]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

// HTTP GET request with proper headers
async function fetchTikTokPage(url: string): Promise<string> {
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        Connection: "keep-alive",
        "Upgrade-Insecure-Requests": "1",
      },
      redirect: "follow",
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.text();
  } catch (error) {
    throw new Error(
      `Failed to fetch TikTok page: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

// Extract and parse JSON from script tag
function extractUniversalData(html: string): TikUniversalData | null {
  const $ = cheerio.load(html);
  const scriptContent = $("script#__UNIVERSAL_DATA_FOR_REHYDRATION__").html();

  if (!scriptContent) {
    throw new Error(
      "Could not find __UNIVERSAL_DATA_FOR_REHYDRATION__ script tag"
    );
  }

  try {
    const data = JSON.parse(scriptContent);
    return data;
  } catch (error) {
    throw new Error("Failed to parse JSON data from script tag");
  }
}

// Extract required data from parsed JSON
function extractVideoData(
  universalData: TikUniversalData,
  url: string
): ScrapeResponse["data"] {
  const videoData =
    universalData.__DEFAULT_SCOPE__["webapp.video-detail"].itemInfo.itemStruct;

  // Extract video URL with tiktok.com domain
  const videoUrls = videoData.video.PlayAddrStruct.UrlList;
  const videoUrl =
    videoUrls.find((url) => url.includes("tiktok.com")) || videoUrls[0] || "";

  // Extract video ID from URL or JSON
  const videoId = videoData.id || extractVideoIdFromUrl(url) || "";

  return {
    author: {
      uniqueId: videoData.author.uniqueId,
      avatarThumb: videoData.author.avatarThumb,
      nickname: videoData.author.nickname,
    },
    suggestedWords: videoData.suggestedWords || [],
    description: videoData.desc || "",
    coverUrl: videoData.video.cover || "",
    dynamicCoverUrl: videoData.video.dynamicCover || "",
    videoUrl,
    videoId,
  };
}

// Main API route handler
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { url } = body;

    // Validate request body
    if (!url || typeof url !== "string") {
      return NextResponse.json(
        {
          success: false,
          error: "URL is required and must be a string",
        } as ScrapeResponse,
        { status: 400 }
      );
    }

    // Validate URL format
    if (!isValidTikTokUrl(url)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid TikTok URL format",
        } as ScrapeResponse,
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
        } as ScrapeResponse,
        { status: 429 }
      );
    }

    // Fetch TikTok page
    const html = await fetchTikTokPage(url);

    // Extract and parse universal data
    const universalData = extractUniversalData(html);

    // Validate extracted data structure
    if (
      !universalData ||
      !universalData.__DEFAULT_SCOPE__?.["webapp.video-detail"]?.itemInfo
        ?.itemStruct
    ) {
      throw new Error("Invalid data structure in TikTok response");
    }

    // Extract video data
    const data = extractVideoData(universalData, url);

    // Return success response
    return NextResponse.json(
      {
        success: true,
        data,
      } as ScrapeResponse,
      { status: 200 }
    );
  } catch (error) {
    console.error("TikTok scraping error:", error);

    // Return error response
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "An unknown error occurred",
      } as ScrapeResponse,
      { status: 500 }
    );
  }
}

// Handle GET requests with query parameter
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const url = searchParams.get("url");

    if (!url) {
      return NextResponse.json(
        {
          success: false,
          error: "URL query parameter is required",
        } as ScrapeResponse,
        { status: 400 }
      );
    }

    // Reuse the POST logic by creating a mock request
    const mockRequest = new Request(request.url, {
      method: "POST",
      body: JSON.stringify({ url }),
    });

    return POST(mockRequest as NextRequest);
  } catch (error) {
    console.error("TikTok scraping error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "An unknown error occurred",
      } as ScrapeResponse,
      { status: 500 }
    );
  }
}
