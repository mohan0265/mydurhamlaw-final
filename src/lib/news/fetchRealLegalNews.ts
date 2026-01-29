// src/lib/news/fetchRealLegalNews.ts

export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  url: string;
  source: string;
  publishedAt: string;
  topicTags: string[];
  discussionPrompt?: string;
  content?: string;
  timestamp: string;
}

interface NewsDataResponse {
  status: string;
  totalResults: number;
  results: NewsDataArticle[];
}

interface NewsDataArticle {
  article_id: string;
  title: string;
  link: string;
  keywords?: string[] | null;
  creator?: string[] | null;
  video_url?: string | null;
  description: string;
  content?: string;
  pubDate: string;
  image_url?: string;
  source_id: string;
  source_priority: number;
  source_url: string;
  source_icon?: string;
  language: string;
  country: string[];
  category: string[];
  ai_tag?: string;
  sentiment?: string;
  sentiment_stats?: string;
  ai_region?: string;
  ai_org?: string;
}

// Map legal keywords to our topic tags
const mapToTopicTags = (
  keywords: string[] | null | undefined,
  title: string,
  description: string,
): string[] => {
  const tags: string[] = [];
  const textToCheck = `${title} ${description}`.toLowerCase();

  // Define keyword mappings
  const tagMappings = {
    "Criminal Law": [
      "criminal",
      "crime",
      "prosecution",
      "arrest",
      "sentencing",
      "prison",
      "murder",
      "theft",
      "fraud",
    ],
    "Constitutional Law": [
      "constitution",
      "constitutional",
      "supreme court",
      "judicial review",
      "parliament",
      "government",
    ],
    "Human Rights Law": [
      "human rights",
      "equality",
      "discrimination",
      "privacy",
      "freedom",
      "civil rights",
      "echr",
    ],
    "Administrative Law": [
      "administrative",
      "public administration",
      "tribunal",
      "ombudsman",
      "regulatory",
    ],
    "European Union Law": [
      "brexit",
      "eu law",
      "european union",
      "european court",
      "single market",
    ],
    "Legal Tech": [
      "artificial intelligence",
      "ai",
      "technology",
      "digital",
      "cyber",
      "data protection",
    ],
    "Evidence Law": [
      "evidence",
      "witness",
      "testimony",
      "forensic",
      "investigation",
    ],
    "Equality Law": [
      "gender",
      "race",
      "disability",
      "age discrimination",
      "sexual orientation",
      "transgender",
    ],
    "Commercial Law": [
      "business",
      "commercial",
      "contract",
      "corporate",
      "company law",
      "trade",
    ],
    "Property Law": [
      "property",
      "land",
      "real estate",
      "housing",
      "landlord",
      "tenant",
    ],
    "Family Law": [
      "family",
      "divorce",
      "child custody",
      "marriage",
      "adoption",
    ],
    "Employment Law": [
      "employment",
      "workplace",
      "employee",
      "employer",
      "labour",
      "union",
    ],
  };

  // Check for keywords in title and description
  Object.entries(tagMappings).forEach(([tag, keywords]) => {
    if (keywords.some((keyword) => textToCheck.includes(keyword))) {
      tags.push(tag);
    }
  });

  // Also use provided keywords if available
  if (keywords && Array.isArray(keywords)) {
    keywords.forEach((keyword) => {
      const keywordLower = keyword.toLowerCase();
      Object.entries(tagMappings).forEach(([tag, mappedKeywords]) => {
        if (
          mappedKeywords.some((mapped) => keywordLower.includes(mapped)) &&
          !tags.includes(tag)
        ) {
          tags.push(tag);
        }
      });
    });
  }

  // Ensure we have at least one tag
  if (tags.length === 0) {
    tags.push("Legal News");
  }

  return tags.slice(0, 3); // Limit to 3 tags max
};

export async function fetchRealLegalNews(): Promise<NewsItem[]> {
  try {
    const apiKey = process.env.NEXT_PUBLIC_NEWSDATA_API_KEY;

    if (!apiKey) {
      throw new Error("NewsData.io API key not found in environment variables");
    }

    console.log("🔍 Fetching real legal news from NewsData.io...");

    // Construct the API URL with parameters
    const params = new URLSearchParams({
      apikey: apiKey,
      q: 'law OR legal OR court OR justice OR "supreme court" OR parliament OR legislation OR judicial',
      language: "en",
      country: "gb",
      category: "politics",
      size: "10",
    });

    const url = `https://newsdata.io/api/1/news?${params.toString()}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(
        `NewsData.io API error: ${response.status} ${response.statusText}`,
      );
    }

    const data: NewsDataResponse = await response.json();

    if (data.status !== "success") {
      throw new Error("NewsData.io API returned error status");
    }

    if (!data.results || data.results.length === 0) {
      console.warn("⚠️ No legal news results found, using fallback articles");
      return getFallbackArticles();
    }

    // Transform NewsData articles to our format
    const transformedArticles: NewsItem[] = data.results.map(
      (article, index) => {
        const topicTags = mapToTopicTags(
          article.keywords,
          article.title,
          article.description,
        );

        return {
          id: article.article_id || `news-${index}`,
          title: article.title || "Untitled Article",
          summary: article.description || "No summary available",
          url: article.link || "#",
          source: article.source_id || "Unknown Source",
          publishedAt: article.pubDate || new Date().toISOString(),
          topicTags,
          content: article.content || article.description,
          timestamp: article.pubDate || new Date().toISOString(),
        };
      },
    );

    console.log(
      `✅ Successfully fetched ${transformedArticles.length} legal news articles`,
    );
    return transformedArticles;
  } catch (error: any) {
    console.error("❌ Error fetching real legal news:", error);

    // Return fallback articles on error
    console.log("🔄 Falling back to sample articles...");
    return getFallbackArticles();
  }
}

// Fallback articles when API fails
function getFallbackArticles(): NewsItem[] {
  return [
    {
      id: "fallback-1",
      title: "Legal News Service Currently Updating",
      summary:
        "We are currently updating our legal news service to bring you the latest developments. Please check back shortly for real-time UK legal news.",
      url: "#",
      source: "Caseway News",
      publishedAt: new Date().toISOString(),
      topicTags: ["System Notice"],
      timestamp: new Date().toISOString(),
      content:
        "Our legal news service is being enhanced to provide you with the most relevant and up-to-date legal developments affecting Durham Law students.",
    },
    {
      id: "fallback-2",
      title: "Stay Connected for Legal Updates",
      summary:
        "While we enhance our news service, consider following the latest legal developments through official channels and legal publications.",
      url: "#",
      source: "Caseway News",
      publishedAt: new Date(Date.now() - 3600000).toISOString(),
      topicTags: ["Legal Education"],
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      content:
        "Keep yourself informed about the latest legal developments by following reputable legal news sources and staying engaged with current affairs.",
    },
  ];
}
