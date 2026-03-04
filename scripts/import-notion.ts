#!/usr/bin/env bun
/**
 * Import content from a Notion export into the Astro site.
 *
 * Reads .md files from the Notion export directory, matches them to existing
 * site pages (by title or slugified path), cleans up the markdown, copies
 * local images, and writes the output to src/pages/.
 */

import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync, copyFileSync, unlinkSync } from "fs";
import { basename, dirname, extname, join, relative, resolve } from "path";

// ── Configuration ──────────────────────────────────────────────────────

const NOTION_DIR = "/Users/osteele/Downloads/Private & Shared/Oliver\u2019s Notes";
const PAGES_DIR = resolve("src/pages");
const PUBLIC_IMAGES_DIR = resolve("public/images");

// Pages that should use MDX with CodeExample components.
// These have code-block-then-image patterns.
const MDX_PAGES = new Set([
  "arranging-items-in-a-line",
  "arranging-items-in-a-circle-or-spiral",
  "arranging-items-in-a-grid",
  "animation-and-randomness",
  "iteration-notes",
  "refactoring-into-functions",
  "processing-and-animation",
  "processing-arrays-and-animation",
]);

// Paths within the Notion export to skip (student work, untitled pages,
// individual tool sub-pages that are aggregated into parent pages, etc.)
const SKIP_PATTERNS = [
  /Final Project Ideas\/(Alan|Allison|Echo|Iris|Leah|Skyler|Kevin|Damon|Steve|Untitled)/,
  /Inspiration Boards\/Inspiration Boards\/(Alan|Allison|Echo|Iris|Leah|Skyler|Kevin|Damon|Steve|Untitled)/,
  /\/Untitled\s+[a-f0-9]+\.md$/,
  // Individual hand/power tool sub-pages (aggregated into parent pages)
  /Hand Tools\/(Bench planes|Card scraper|Chisel|Clamps|Rasps|Sanding block|Saw |Spokeshave)/,
  /Hand Tools – Measure and Marking\/(Combination square|Marking gauge|Marking knife|Straight Edge|T square)/,
  /Power Tools\/(Band Saw|Disc belt|Drill Press|Drill |Driver |Dust Collector|Lathe|Miter Saw|Oscillating|Power Planar|Random Orbital|Router |Scroll Saw|Shop vac|Table Saw)/,
  // Saw Rasp has its own page, don't skip it via Hand Tools pattern
];

// Manual overrides for Notion filenames that don't match by slug
const MANUAL_OVERRIDES: Record<string, string> = {
  "Arranging a Line of Items": "/courses/creative-coding/arranging-items-in-a-line/",
  "p5 js Examples": "/p5js/examples/",
  "p5 js Tutorials": "/p5js/tutorials/",
  "I Use (macOS Software)": "/uses/macos/",
  "Repl it": "/tools/code-playgrounds/replit/",
  "Visual Studio Code for P5 js": "/p5js/vscode/",
  "p5 js Course Materials": "/p5js-resources/",
  "Arranging Items in a Grid (Processing)": "/processing/arranging-items-in-processing/",
  "Adafruit BNO055 9-DOF Absolute Orientation IMU Fus": "/physical-computing/imus-and-accelerometers/sensors/adafruit-bno055-9-dof-absolute-orientation-imu-fusion-breakout/",
  "Pausing Part of a Sketch (The Alternative to noLoo": "/p5js/tutorials/pausing-part-of-a-sketch-the-alternative-to-noloop/",
  "Change the background color based on the mouse pos": "/courses/creative-coding/cclab-example-codes/change-the-background-color-based-on-the-mouse-position/",
  "Invert color with a boolean variable and if-statem": "/courses/creative-coding/cclab-example-codes/invert-color-with-a-boolean-variable-and-if-statements/",
  "Place two ellipses at the same positions by re-usi": "/courses/creative-coding/cclab-example-codes/place-two-ellipses-at-the-same-positions-by-re-using-variables/",
  "Movement Practices Lab 1 Pose Detection with Blaze": "/courses/movement-practices-class/movement-practices-lab-1-pose-detection-with-blazepose/",
  "Movement Practices Lab 1 Pose Detection with PoseN": "/courses/movement-practices-class/movement-practices-lab-1-pose-detection-with-posenet/",
};

// Overrides keyed by Notion hash ID (for pages with truncated identical prefixes)
const ID_OVERRIDES: Record<string, string | null> = {
  // "Configuring Visual Studio Code for p5.js Development (Live Server)"
  "71168af2976941478b633f69914a69b2": "/tools/vscode/configuring-visual-studio-code-for-p5js-development-live-server/",
  // "Configuring Visual Studio Code for p5.js Development with the P5 Server extension"
  "fad34048f15445a089a4b28c7057c339": "/tools/vscode/configuring-visual-studio-code-for-p5js-development-p5-server/",
  // "Configuring Visual Studio Code for p5.js Development (Live Server and GitHub)" — no existing page, skip
  "775bcd1d366443d5816f9e32e7e9d2b8": null,
  // "Arranging Items in a Grid (Processing)" → merged into parent
  "989803fecdfd424da1cdb6a2a166fb0a": null,
};

// ── Build the URL map ──────────────────────────────────────────────────

interface PageEntry {
  url: string;
  title: string;
  filePath: string;
  ext: string;
}

function buildExistingPagesMap(): Map<string, PageEntry> {
  const pages = new Map<string, PageEntry>();

  function walk(dir: string) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (entry.name.match(/^index\.(md|mdx|astro)$/)) {
        const ext = extname(entry.name).slice(1);
        const rel = relative(PAGES_DIR, dir);
        const url = rel === "" ? "/" : `/${rel}/`;
        const content = readFileSync(full, "utf-8");
        const m = content.match(/^title:\s*["']?(.+?)["']?\s*$/m);
        const title = m ? m[1] : "";
        pages.set(url, { url, title, filePath: full, ext });
      }
    }
  }

  walk(PAGES_DIR);
  return pages;
}

/** Slugify a Notion filename/path segment. */
function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/p5\s*js/gi, "p5js")
    .replace(/['']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Strip the Notion hash ID from a filename. */
function stripNotionId(filename: string): string {
  // "Some Title abc123def456.md" → "Some Title"
  return filename.replace(/\s+[a-f0-9]{20,}\.md$/, ".md").replace(/\.md$/, "");
}

/** Build a map from Notion file paths to site URLs. */
function buildNotionToUrlMap(
  notionFiles: NotionFile[],
  existingPages: Map<string, PageEntry>
): Map<string, string> {
  const mapping = new Map<string, string>();

  // Index existing pages by normalized title for matching
  const titleIndex = new Map<string, string>();
  for (const [url, page] of existingPages) {
    if (page.title) {
      titleIndex.set(page.title.toLowerCase(), url);
    }
  }

  // Index existing pages by URL slug for matching
  const slugIndex = new Map<string, string>();
  for (const [url] of existingPages) {
    const slug = url.replace(/\/$/, "").split("/").pop() || "";
    if (slug && !slugIndex.has(slug)) {
      slugIndex.set(slug, url);
    }
  }

  for (const nf of notionFiles) {
    // Skip student pages and other excluded patterns
    if (SKIP_PATTERNS.some((p) => p.test(nf.relPath))) {
      continue;
    }

    const title = stripNotionId(basename(nf.path));

    // 0a. Try ID-based override
    const idMatch = basename(nf.path).match(/([a-f0-9]{20,})\.md$/);
    if (idMatch && ID_OVERRIDES[idMatch[1]] !== undefined) {
      if (ID_OVERRIDES[idMatch[1]] === null) continue;
      mapping.set(nf.path, ID_OVERRIDES[idMatch[1]]!);
      continue;
    }

    // 0b. Try manual override by title
    if (MANUAL_OVERRIDES[title] !== undefined) {
      if (MANUAL_OVERRIDES[title] === null) continue;
      mapping.set(nf.path, MANUAL_OVERRIDES[title]);
      continue;
    }

    // 1. Try exact title match
    const titleKey = title.toLowerCase();
    if (titleIndex.has(titleKey)) {
      mapping.set(nf.path, titleIndex.get(titleKey)!);
      continue;
    }

    // 2. Try slugified title match against URL slugs
    const sluggedTitle = slugify(title);
    if (slugIndex.has(sluggedTitle)) {
      mapping.set(nf.path, slugIndex.get(sluggedTitle)!);
      continue;
    }

    // 3. Try prefix match on title (for truncated Notion filenames)
    const titleLower = title.toLowerCase();
    let prefixMatch: string | null = null;
    for (const [existingTitle, url] of titleIndex) {
      if (existingTitle.startsWith(titleLower) && titleLower.length > 15) {
        prefixMatch = url;
        break;
      }
    }
    if (prefixMatch) {
      mapping.set(nf.path, prefixMatch);
      continue;
    }

    // 4. Try matching the full slugified path
    const pathParts = nf.relPath.split("/");
    const sluggedParts = pathParts
      .map((p) => slugify(stripNotionId(p.replace(/\.md$/, ""))))
      .filter(Boolean);
    // Try progressively shorter path suffixes
    for (let i = 0; i < sluggedParts.length; i++) {
      const candidate = "/" + sluggedParts.slice(i).join("/") + "/";
      if (existingPages.has(candidate)) {
        mapping.set(nf.path, candidate);
        break;
      }
    }
  }

  return mapping;
}

// ── Notion file discovery ──────────────────────────────────────────────

interface NotionFile {
  path: string;
  relPath: string;
  dir: string;
}

function discoverNotionFiles(): NotionFile[] {
  const files: NotionFile[] = [];

  function walk(dir: string) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (entry.name.endsWith(".md")) {
        files.push({
          path: full,
          relPath: relative(NOTION_DIR, full),
          dir: dir,
        });
      }
    }
  }

  walk(NOTION_DIR);
  return files;
}

// ── Markdown processing ────────────────────────────────────────────────

/** Find the image directory for a Notion markdown file. */
function findImageDir(notionFile: NotionFile): string | null {
  const title = stripNotionId(basename(notionFile.path));
  const candidate = join(notionFile.dir, title);
  if (existsSync(candidate) && statSync(candidate).isDirectory()) {
    return candidate;
  }
  return null;
}

/** Compute layout path from URL depth. */
function layoutPath(url: string): string {
  const depth = url.split("/").filter(Boolean).length;
  const ups = "../".repeat(depth + 1);
  return `${ups}layouts/BaseLayout.astro`;
}

/** Clean up Notion markdown content. */
function cleanMarkdown(
  content: string,
  url: string,
  notionToUrl: Map<string, string>,
  notionFile: NotionFile,
  pageSlug: string,
  isMdx: boolean
): string {
  let lines = content.split("\n");

  // Strip leading "# Title" (first non-empty line if it's an h1)
  const firstContentIdx = lines.findIndex((l) => l.trim() !== "");
  if (firstContentIdx >= 0 && lines[firstContentIdx].match(/^# /)) {
    lines.splice(firstContentIdx, 1);
  }

  let md = lines.join("\n");

  // Remove stray "Copy" lines (Notion code block copy buttons)
  md = md.replace(/^Copy\s*$/gm, "");

  // Remove Notion metadata lines at the start of content
  // These are lines like "Created: ...", "URL: ...", "Tags: ...", "Creation Date: ..."
  md = md.replace(/^(Created|URL|Tags|Creation Date|Last Edited|Property|Status|Type|Category|Due Date):\s+.+\n/gm, "");

  // Map unsupported code languages to supported ones
  md = md.replace(/^```arduino$/gm, "```cpp");

  // Remove Notion bookmark embeds that are just URLs
  // Pattern: lines like "> [URL](URL)" or standalone URLs after headings
  // Keep these as-is since they're intentional content

  // Rewrite local image references
  // ![alt](SubFolder/image.png) → ![alt](/images/<page-slug>/image.png)
  // Match image syntax, handling parentheses in filenames and nested brackets in alt.
  // The regex matches ![ ... ]( ... ) where:
  // - alt text can contain nested brackets (Notion embeds links in alt text)
  // - src matches to the last ) on the line (handles parens in filenames)
  md = md.replace(
    /!\[((?:[^\[\]]|\[[^\]]*\])*)\]\((.+)\)$/gm,
    (match, alt: string, src: string) => {
      // Keep external URLs as-is
      if (src.startsWith("http://") || src.startsWith("https://")) {
        return match;
      }
      // Decode percent-encoded path
      const decoded = decodeURIComponent(src);
      const imgFilename = basename(decoded);
      // Percent-encode parentheses in filenames to avoid breaking markdown syntax
      const safeFilename = imgFilename.replace(/\(/g, "%28").replace(/\)/g, "%29");
      return `![${alt}](/images/${pageSlug}/${safeFilename})`;
    }
  );

  // Rewrite internal links
  // [text](Path%20With%20Spaces%20hash.md) → [text](/url-slug/)
  // [text](../Path/File%20hash.md) → [text](/url-slug/)
  md = md.replace(
    /\[([^\]]+)\]\(([^)]+\.md)\)/g,
    (match, text: string, href: string) => {
      if (href.startsWith("http")) return match;

      // Resolve the link relative to the current Notion file
      const decoded = decodeURIComponent(href);
      const resolved = resolve(notionFile.dir, decoded);

      // Look up in the mapping
      if (notionToUrl.has(resolved)) {
        return `[${text}](${notionToUrl.get(resolved)})`;
      }

      // Try to find by slugifying the link target
      const linkTitle = stripNotionId(basename(decoded));
      const linkSlug = slugify(linkTitle);
      // Search all URLs for a match
      for (const [, mappedUrl] of notionToUrl) {
        const urlSlug = mappedUrl.replace(/\/$/, "").split("/").pop() || "";
        if (urlSlug === linkSlug) {
          return `[${text}](${mappedUrl})`;
        }
      }

      // Leave as-is if we can't resolve
      console.warn(`  ⚠ Unresolved link: [${text}](${href})`);
      return match;
    }
  );

  // Clean up excessive blank lines
  md = md.replace(/\n{4,}/g, "\n\n\n");

  // Trim
  md = md.trim();

  return md;
}

/**
 * Convert markdown to MDX with CodeExample components.
 *
 * For MDX pages, we need to:
 * 1. Convert code-block + image pairs to <CodeExample> components
 * 2. Escape curly braces in prose (but not in JSX or code blocks)
 * 3. Leave standalone code blocks as regular fenced blocks
 */
function convertToMdx(md: string): string {
  // Split into segments: code blocks vs prose
  const segments: Array<{ type: "code" | "prose"; content: string; lang?: string }> = [];
  const codeBlockRegex = /^```(\w*)\n([\s\S]*?)^```\s*$/gm;
  let lastIndex = 0;

  for (const match of md.matchAll(codeBlockRegex)) {
    // Add prose before this code block
    if (match.index! > lastIndex) {
      segments.push({ type: "prose", content: md.slice(lastIndex, match.index!) });
    }
    segments.push({ type: "code", content: match[2], lang: match[1] || "javascript" });
    lastIndex = match.index! + match[0].length;
  }
  // Add remaining prose
  if (lastIndex < md.length) {
    segments.push({ type: "prose", content: md.slice(lastIndex) });
  }

  // Now process: look for code block followed by image in next prose segment
  const output: string[] = [];
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];

    if (seg.type === "code") {
      // Check if next prose segment starts with an image
      const nextProse = segments[i + 1];
      if (nextProse?.type === "prose") {
        const imgMatch = nextProse.content.match(/^\s*!\[([^\]]*)\]\(([^)\n]+)\)/);
        if (imgMatch) {
          // Convert to CodeExample
          const code = seg.content.trim()
            .replace(/\\/g, "\\\\")
            .replace(/`/g, "\\`")
            .replace(/\$/g, "\\$");
          const alt = imgMatch[1];
          const src = imgMatch[2];
          output.push(`<CodeExample code={\`${code}\`} lang="${seg.lang}" image="${src}" alt="${alt}" />`);

          // Remove the image from the next prose segment
          nextProse.content = nextProse.content.slice(imgMatch[0].length);
          continue;
        }
      }

      // Standalone code block — keep as fenced
      output.push("```" + seg.lang + "\n" + seg.content + "```");
    } else {
      // Prose segment — escape curly braces for MDX
      let prose = seg.content;
      // Escape { and } in prose, but not in inline code
      prose = prose.replace(/(`[^`]*`)|(\{)|(\})/g, (_m, inlineCode: string, open: string, close: string) => {
        if (inlineCode) return inlineCode;
        if (open) return "\\{";
        if (close) return "\\}";
        return _m;
      });
      output.push(prose);
    }
  }

  return output.join("");
}

// ── Image handling ─────────────────────────────────────────────────────

function copyImages(notionFile: NotionFile, pageSlug: string): number {
  const imageDir = findImageDir(notionFile);
  if (!imageDir) return 0;

  const destDir = join(PUBLIC_IMAGES_DIR, pageSlug);
  let count = 0;

  function copyDir(srcDir: string) {
    if (!existsSync(srcDir)) return;
    for (const entry of readdirSync(srcDir, { withFileTypes: true })) {
      const srcPath = join(srcDir, entry.name);
      if (entry.isDirectory()) {
        // Don't recurse into subdirectories that are Notion page directories
        continue;
      }
      if (entry.name.match(/\.(png|jpg|jpeg|gif|svg|webp)$/i)) {
        if (!existsSync(destDir)) {
          mkdirSync(destDir, { recursive: true });
        }
        copyFileSync(srcPath, join(destDir, entry.name));
        count++;
      }
    }
  }

  copyDir(imageDir);
  return count;
}

// ── Main ───────────────────────────────────────────────────────────────

function main() {
  console.log("📚 Importing content from Notion export...\n");

  // 1. Discover Notion files
  const notionFiles = discoverNotionFiles();
  console.log(`Found ${notionFiles.length} Notion markdown files`);

  // 2. Build existing pages map
  const existingPages = buildExistingPagesMap();
  console.log(`Found ${existingPages.size} existing site pages`);

  // 3. Build URL mapping
  const notionToUrl = buildNotionToUrlMap(notionFiles, existingPages);
  console.log(`Mapped ${notionToUrl.size} Notion files to site URLs\n`);

  // Stats
  let imported = 0;
  let skipped = 0;
  let imagesCount = 0;
  const unmatched: string[] = [];

  for (const nf of notionFiles) {
    // Skip excluded pages
    if (SKIP_PATTERNS.some((p) => p.test(nf.relPath))) {
      skipped++;
      continue;
    }
    // Skip pages explicitly set to null in overrides
    const fileIdMatch = basename(nf.path).match(/([a-f0-9]{20,})\.md$/);
    if (fileIdMatch && ID_OVERRIDES[fileIdMatch[1]] === null) {
      skipped++;
      continue;
    }

    const url = notionToUrl.get(nf.path);
    if (!url) {
      unmatched.push(nf.relPath);
      skipped++;
      continue;
    }

    // Skip the homepage (index.astro)
    if (url === "/") {
      skipped++;
      continue;
    }

    const content = readFileSync(nf.path, "utf-8");

    // Extract title from first H1
    const titleMatch = content.match(/^# (.+)$/m);
    const title = titleMatch ? titleMatch[1] : stripNotionId(basename(nf.path));

    // Determine page slug (last segment of URL)
    const pageSlug = url.replace(/\/$/, "").split("/").pop() || "root";

    // Determine if this should be MDX
    const isMdx = MDX_PAGES.has(pageSlug);

    // Clean up content (no MDX escaping — handled separately)
    let cleaned = cleanMarkdown(content, url, notionToUrl, nf, pageSlug, false);

    // Copy images
    const imgCount = copyImages(nf, pageSlug);
    imagesCount += imgCount;

    // For MDX pages, convert code+image pairs to CodeExample and escape braces
    if (isMdx) {
      cleaned = convertToMdx(cleaned);
    }

    // Build frontmatter
    const layout = layoutPath(url);
    const escapedTitle = title.replace(/"/g, '\\"');
    let frontmatter = `---\ntitle: "${escapedTitle}"\nlayout: ${layout}\n---\n`;

    // Add MDX import if needed
    let body: string;
    if (isMdx && cleaned.includes("<CodeExample")) {
      body = `import CodeExample from "@/components/CodeExample.astro";\n\n${cleaned}\n`;
    } else {
      body = `\n${cleaned}\n`;
    }

    // Determine output path
    const ext = isMdx ? "mdx" : "md";
    const outDir = join(PAGES_DIR, url.slice(1));
    const outPath = join(outDir, `index.${ext}`);

    // Remove other index files in the same directory (e.g. .md when writing .mdx)
    for (const otherExt of ["md", "mdx", "astro"]) {
      if (otherExt === ext) continue;
      const otherPath = join(outDir, `index.${otherExt}`);
      if (existsSync(otherPath)) {
        unlinkSync(otherPath);
      }
    }

    // Write
    if (!existsSync(outDir)) {
      mkdirSync(outDir, { recursive: true });
    }
    writeFileSync(outPath, frontmatter + body);
    imported++;

    if (imgCount > 0) {
      console.log(`  ✓ ${url} (${imgCount} images)`);
    }
  }

  // Report
  console.log(`\n── Summary ──`);
  console.log(`Imported: ${imported} pages`);
  console.log(`Images:   ${imagesCount} files copied`);
  console.log(`Skipped:  ${skipped} files`);

  if (unmatched.length > 0) {
    console.log(`\n── Unmatched Notion files (${unmatched.length}) ──`);
    for (const u of unmatched.sort()) {
      console.log(`  • ${u}`);
    }
  }
}

main();
