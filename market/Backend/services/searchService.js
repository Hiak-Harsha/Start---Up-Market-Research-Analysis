import axios from "axios";

export async function searchWeb(query) {
  try {
    const res = await axios.post(
      "https://api.tavily.com/search",
      {
        api_key: process.env.TAVILY_API_KEY,
        query,
        search_depth: "advanced",
        max_results: 5
      }
    );

    return res.data.results.map(r => ({
      title: r.title,
      content: r.content,
      url: r.url
    }));

  } catch (err) {
    console.error("Search error:", err.message);
    return [];
  }
}