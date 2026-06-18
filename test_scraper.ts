import { getChapterPages } from "./src/lib/scraper";

async function test() {
  const url = "https://komiku.org/mount-hua-sects-genius-phantom-swordsman-chapter-65/";
  console.log("=== Testing getChapterPages for:", url);
  const chapterPages = await getChapterPages(url);
  if (!chapterPages) {
    console.log("Failed to load chapter pages (returned null)!");
    return;
  }
  console.log("Chapter Title:", chapterPages.title);
  console.log("Chapter Number:", chapterPages.chapter);
  console.log("Images count:", chapterPages.images.length);
  if (chapterPages.images.length > 0) {
    console.log("First 5 images:", chapterPages.images.slice(0, 5));
  } else {
    console.log("No images found!");
  }
}

test().catch(console.error);
