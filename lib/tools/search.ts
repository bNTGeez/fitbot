export type WebResult = {
  title: string;
  url: string;
  snippet?: string;
};

export async function searchWeb(
  query: string,
  max_results = 3
): Promise<{
  total: number;
  query: string;
  googleUrl?: string;
  items: WebResult[];
}> {
  try {
    if (!process.env.SERPAPI_API_KEY) {
      throw new Error("SERPAPI_API_KEY is not set");
    }

    const baseUrl = "https://serpapi.com/search.json";
    const params = new URLSearchParams({
      engine: "google",
      q: query,
      num: max_results.toString(),
      api_key: process.env.SERPAPI_API_KEY,
    });

    const response = await fetch(`${baseUrl}?${params}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(`SerpAPI error: ${data.error || response.statusText}`);
    }

    const organic = (data.organic_results || []) as Array<{
      title: string;
      link: string;
      snippet?: string;
    }>;

    return {
      total: data.search_information?.total_results ?? organic.length,
      query,
      googleUrl: data.search_metadata?.google_url,
      items: organic.map((r) => ({
        title: r.title,
        url: r.link,
        snippet: r.snippet,
      })),
    };
  } catch (error) {
    console.error("Search error:", error);

    // Return empty results for other errors
    return {
      total: 0,
      query,
      items: [],
    };
  }
}
