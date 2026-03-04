import * as cheerio from "cheerio";
import * as fs from "fs";
import * as path from "path";
import TurndownService from "turndown";

const ROOT = path.resolve(import.meta.dirname, "..");
const SRC_PAGES = path.join(ROOT, "src", "pages");

const turndown = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
  bulletListMarker: "-",
});

// Custom rule: convert <pre><code> to fenced code blocks with language detection
turndown.addRule("fencedCodeBlock", {
  filter: (node) =>
    node.nodeName === "PRE" &&
    node.firstChild !== null &&
    node.firstChild.nodeName === "CODE",
  replacement: (_content, node) => {
    const codeEl = (node as HTMLElement).querySelector("code");
    if (!codeEl) return _content;
    const code = codeEl.textContent || "";
    const lang = detectLanguage(
      code,
      codeEl.className || (node as HTMLElement).className,
    );
    return `\n\n\`\`\`${lang}\n${code.replace(/\n$/, "")}\n\`\`\`\n\n`;
  },
});

// Preserve certain HTML blocks as raw HTML
turndown.addRule("preserveHtmlBlocks", {
  filter: (node) => {
    if (node.nodeType !== 1) return false;
    const el = node as HTMLElement;
    return (
      el.classList.contains("callout") ||
      el.classList.contains("code-example") ||
      el.classList.contains("two-column") ||
      el.classList.contains("page-list") ||
      el.classList.contains("section-header")
    );
  },
  replacement: (_content, node) => {
    return `\n\n${(node as HTMLElement).outerHTML}\n\n`;
  },
});

// Preserve tables as raw HTML (Markdown tables are fragile with code cells)
turndown.addRule("preserveTables", {
  filter: "table",
  replacement: (_content, node) => {
    return `\n\n${(node as HTMLElement).outerHTML}\n\n`;
  },
});

function detectLanguage(code: string, className: string): string {
  // Check class name first (e.g., "language-javascript")
  const classMatch = className.match(/language-(\w+)/);
  if (classMatch) return classMatch[1];

  // Heuristic detection
  if (
    /void\s+setup\s*\(/.test(code) ||
    /void\s+draw\s*\(/.test(code) ||
    /void\s+loop\s*\(/.test(code) ||
    /size\(\d+,\s*\d+\)/.test(code) ||
    /PVector|PImage|PFont/.test(code)
  ) {
    return "java"; // Processing
  }
  if (
    /function\s+setup\s*\(/.test(code) ||
    /function\s+draw\s*\(/.test(code) ||
    /createCanvas\s*\(/.test(code) ||
    /p5\./.test(code)
  ) {
    return "javascript";
  }
  if (/import\s+\w+|from\s+['"]/.test(code)) return "javascript";
  if (/console\.log|const |let |var /.test(code)) return "javascript";
  if (/def\s+\w+|import\s+\w+|print\(/.test(code)) return "python";
  if (
    /^\s*#include|int\s+main|void\s+\w+\(/.test(code) &&
    !code.includes("function")
  ) {
    return "cpp";
  }
  if (/\$\s|apt|sudo|brew|npm|bun|pip/.test(code)) return "bash";
  if (/<html|<div|<body/.test(code)) return "html";
  if (/^{[\s\S]*}$/m.test(code.trim())) return "json";
  return "";
}

function resolveRelativeLink(
  href: string,
  pageDir: string,
  rootDir: string,
): string {
  if (
    href.startsWith("http://") ||
    href.startsWith("https://") ||
    href.startsWith("#") ||
    href.startsWith("mailto:")
  ) {
    return href;
  }

  // Resolve relative path to absolute from site root
  const resolved = path.resolve(pageDir, href);
  let relative = path.relative(rootDir, resolved);

  // Convert to root-relative URL
  let url = "/" + relative.replace(/\\/g, "/");

  // Normalize index.html references
  url = url.replace(/\/index\.html$/, "/");
  url = url.replace(/\.html$/, "/");

  return url;
}

function convertPage(htmlPath: string): void {
  const html = fs.readFileSync(htmlPath, "utf-8");
  const $ = cheerio.load(html);

  // Extract title
  let title = $("title").text();
  title = title
    .replace(/\s*[-–—]\s*Oliver'?s?\s*Notes$/i, "")
    .replace(/\s*[-–—]\s*Oliver Steele$/i, "")
    .trim();

  if (!title) {
    title = $("h1").first().text().trim() || "Untitled";
  }

  // Get the page directory relative to root (for link resolution)
  const pageDir = path.dirname(htmlPath);
  const relPath = path.relative(ROOT, pageDir);

  // Extract main content
  const main = $("main");
  if (main.length === 0) {
    console.warn(`  Skipping ${relPath}: no <main> element`);
    return;
  }

  // Remove breadcrumb and h1
  main.find(".breadcrumb").remove();
  main.find("h1").first().remove();

  // Rewrite relative links in the HTML before converting
  main.find("a[href]").each((_i, el) => {
    const href = $(el).attr("href");
    if (href) {
      $(el).attr("href", resolveRelativeLink(href, pageDir, ROOT));
    }
  });

  main.find("img[src]").each((_i, el) => {
    const src = $(el).attr("src");
    if (src && !src.startsWith("http")) {
      $(el).attr("src", resolveRelativeLink(src, pageDir, ROOT));
    }
  });

  // Convert to markdown
  const mainHtml = main.html();
  if (!mainHtml) {
    console.warn(`  Skipping ${relPath}: empty <main>`);
    return;
  }

  let markdown = turndown.turndown(mainHtml);

  // Clean up excessive whitespace
  markdown = markdown.replace(/\n{3,}/g, "\n\n").trim();

  // Build frontmatter
  const frontmatter = [
    "---",
    `title: ${JSON.stringify(title)}`,
    `layout: ../../layouts/BaseLayout.astro`,
    "---",
  ].join("\n");

  // Fix layout path based on depth
  const depth = relPath.split(path.sep).filter(Boolean).length;
  const layoutPath = "../".repeat(depth + 1) + "layouts/BaseLayout.astro";

  const finalFrontmatter = frontmatter.replace(
    "../../layouts/BaseLayout.astro",
    layoutPath,
  );

  // Write output
  const outPath = path.join(SRC_PAGES, relPath, "index.md");
  const outDir = path.dirname(outPath);
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(outPath, finalFrontmatter + "\n\n" + markdown + "\n");
}

// Find all index.html files
function findHtmlPages(): string[] {
  const pages: string[] = [];

  function walk(dir: string) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        // Skip src, node_modules, .git, etc.
        if (
          ["src", "node_modules", ".git", ".jj", "dist", ".astro", "scripts", "public"].includes(
            entry.name,
          )
        ) {
          continue;
        }
        walk(fullPath);
      } else if (entry.name === "index.html" && dir !== ROOT) {
        pages.push(fullPath);
      }
    }
  }

  walk(ROOT);
  return pages;
}

// Main
const pages = findHtmlPages();
console.log(`Found ${pages.length} HTML pages to convert`);

let converted = 0;
let skipped = 0;

for (const page of pages) {
  const rel = path.relative(ROOT, page);
  try {
    convertPage(page);
    converted++;
    if (converted % 20 === 0) {
      console.log(`  Converted ${converted}/${pages.length}...`);
    }
  } catch (err) {
    console.error(`  Error converting ${rel}:`, err);
    skipped++;
  }
}

console.log(`Done: ${converted} converted, ${skipped} skipped`);
