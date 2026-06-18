const axios = require('axios');
const cheerio = require('cheerio');

const BASE_URL = "https://komiku.org";

const headers = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
  "Accept-Language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
  Referer: BASE_URL,
};

async function test() {
  try {
    const res = await axios.get(BASE_URL + "/", { headers, timeout: 15000 });
    const $ = cheerio.load(res.data);
    
    // Find first few image sources
    const covers = [];
    $("img").each((_, el) => {
      const src = $(el).attr("data-src") || $(el).attr("data-lazy-src") || $(el).attr("src") || "";
      if (src && (src.includes("uploads") || src.includes("upload"))) {
        covers.push(src);
      }
    });
    
    console.log("Found covers:", covers.slice(0, 5));
    
    if (covers.length > 0) {
      const coverUrl = covers[0].startsWith("http") ? covers[0] : BASE_URL + covers[0];
      console.log(`\nTesting cover: ${coverUrl}`);
      try {
        const coverRes = await axios.get(coverUrl, {
          headers: {
            "User-Agent": headers["User-Agent"]
          },
          timeout: 5000
        });
        console.log("No referrer status:", coverRes.status);
      } catch (err) {
        console.log("No referrer failed status:", err.response?.status, err.message);
      }
    }
  } catch (err) {
    console.error("Failed:", err.message);
  }
}

test();
