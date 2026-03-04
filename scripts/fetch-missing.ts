import * as cheerio from "cheerio";
import * as fs from "fs";
import * as path from "path";
import TurndownService from "turndown";

const ROOT = path.resolve(import.meta.dirname, "..");
const SRC_PAGES = path.join(ROOT, "src", "pages");
const BASE_URL = "https://notes.osteele.com";

const turndown = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
  bulletListMarker: "-",
});

// Same rules as convert.ts
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

turndown.addRule("preserveTables", {
  filter: "table",
  replacement: (_content, node) => {
    return `\n\n${(node as HTMLElement).outerHTML}\n\n`;
  },
});

function detectLanguage(code: string, className: string): string {
  const classMatch = className.match(/language-(\w+)/);
  if (classMatch) return classMatch[1];
  if (/void\s+setup\s*\(|void\s+draw\s*\(|PVector|PImage/.test(code))
    return "java";
  if (/function\s+setup\s*\(|createCanvas\s*\(|p5\./.test(code))
    return "javascript";
  if (/console\.log|const |let |var /.test(code)) return "javascript";
  if (/def\s+\w+|print\(/.test(code)) return "python";
  if (/^\s*#include|int\s+main/.test(code)) return "cpp";
  if (/\$\s|apt|sudo|brew|npm|bun/.test(code)) return "bash";
  if (/<html|<div|<body/.test(code)) return "html";
  return "";
}

function resolveLink(href: string, pagePath: string): string {
  if (
    href.startsWith("http://") ||
    href.startsWith("https://") ||
    href.startsWith("#") ||
    href.startsWith("mailto:")
  ) {
    return href;
  }
  // Resolve relative to page path
  const base = pagePath.endsWith("/") ? pagePath : path.dirname(pagePath);
  const resolved = new URL(href, `${BASE_URL}${base}`);
  let url = resolved.pathname;
  if (!url.endsWith("/")) url += "/";
  return url;
}

// Pages to fetch from MISSING-PAGES.md
const PAGES_TO_FETCH = [
  // courses/creative-coding/ other
  "/courses/creative-coding/fruitful-functions-return",
  "/courses/creative-coding/random-elements-in-a-grid",
  "/courses/creative-coding/scope-and-shadowing",
  "/courses/creative-coding/techniques-for-exploring-parameter-spaces",

  // courses/interaction-lab/
  "/courses/interaction-lab/collaboration-tips",
  "/courses/interaction-lab/language-constructs",
  "/courses/interaction-lab/processing",
  "/courses/interaction-lab/processing-and-animation",
  "/courses/interaction-lab/processing/processing-cookbook",
  "/courses/interaction-lab/processing/speech-recognition",
  "/courses/interaction-lab/using-serial-with-processing-4-on-apple-silicon",

  // courses/movement-practices-class/
  "/courses/movement-practices-class/connecting-p5js-to-zoom",
  "/courses/movement-practices-class/imu-tools",
  "/courses/movement-practices-class/imu-tools/1",
  "/courses/movement-practices-class/imu-tools/2",
  "/courses/movement-practices-class/imu-tools/3",
  "/courses/movement-practices-class/imu-tools/4",
  "/courses/movement-practices-class/imu-tools/5",
  "/courses/movement-practices-class/imu-tools/6",
  "/courses/movement-practices-class/imu-tools/untitled",
  "/courses/movement-practices-class/javascript-resources",
  "/courses/movement-practices-class/movement-practices-lab-1-pose-detection-with-blazepose",
  "/courses/movement-practices-class/movement-practices-lab-1-pose-detection-with-posenet",
  "/courses/movement-practices-class/p5js-particle-workshop",
  "/courses/movement-practices-coding-resources",

  // courses/woodworking
  "/courses/woodworking-for-art-and-design/final-projects/final-project-ideas/allison",
  "/courses/woodworking-for-art-and-design/final-projects/inspiration-boards/alan",
  "/courses/woodworking-for-art-and-design/final-projects/inspiration-boards/echo",
  "/courses/woodworking-for-art-and-design/final-projects/inspiration-boards/inspiration-boards",
  "/courses/woodworking-for-art-and-design/final-projects/inspiration-boards/iris",
  "/courses/woodworking-for-art-and-design/final-projects/inspiration-boards/leah-b",
  "/courses/woodworking-for-art-and-design/final-projects/inspiration-boards/skyler",

  // courses/ other
  "/courses/presenting-at-an-exhibition",

  // physical-computing/
  "/physical-computing/arduino/multi-stage-sketches",
  "/physical-computing/imus-and-accelerometers/sensors",
  "/physical-computing/imus-and-accelerometers/sensors/adafruit-bno055-9-dof-absolute-orientation-imu-fusion-breakout",
  "/physical-computing/imus-and-accelerometers/sensors/gravity-bno055bmp280-intelligent-10dof-ahrs",
  "/physical-computing/imus-and-accelerometers/sensors/grove-3-axis-digital-compass",
  "/physical-computing/imus-and-accelerometers/sensors/grove-6-axis-accelerometer-compass",
  "/physical-computing/imus-and-accelerometers/sensors/grove-adxl335-3-axis-analog-accelerometer",
  "/physical-computing/imus-and-accelerometers/sensors/grove-adxl345-3-axis-digital-accelerometer",
  "/physical-computing/p5js-imu-workshop",
  "/physical-computing/properties-of-electronic-components",

  // tools/
  "/tools/code-playgrounds/code-sandbox",
  "/tools/code-playgrounds/codechef",
  "/tools/code-playgrounds/gitpod",
  "/tools/code-playgrounds/js-bin",
  "/tools/code-playgrounds/paizacloud",
  "/tools/static-hosting/zeit",
  "/tools/vscode/configuring-visual-studio-code-for-p5js-development-live-server",
  "/tools/vscode/configuring-visual-studio-code-for-p5js-development-p5-server",
  "/tools/vscode/p5js",

  // processing/
  "/processing/animation-and-randomness-processing",
  "/processing/arranging-items-in-grid-processing",
  "/processing/arranging-items-in-processing/arranging-items-in-a-circle-or-spiral-1",
  "/processing/arranging-items-in-processing/arranging-items-in-lines-and-waves",
  "/processing/serial-communication-using-serialrecord",

  // covid-19/
  "/covid-19",
  "/covid-19/masks-and-respirators",
  "/covid-19/shanghai-spring-2022-covid-19-outbreak",
  "/covid-19/ventilation",

  // uses/
  "/uses/macos/visual-studio-code-for-presentations",
  "/uses/photography",
  "/uses/qr-codes",
  "/uses/shortcuts",

  // keyboard-shortcuts/
  "/keyboard-shortcuts/google-slides",
  "/keyboard-shortcuts/youtube",

  // student work - band-saw-boxes
  "/band-saw-boxes-student-work",
  "/band-saw-boxes-student-work/alan",
  "/band-saw-boxes-student-work/alison",
  "/band-saw-boxes-student-work/damon",
  "/band-saw-boxes-student-work/echo",
  "/band-saw-boxes-student-work/iris",
  "/band-saw-boxes-student-work/kevin",
  "/band-saw-boxes-student-work/leah-b",
  "/band-saw-boxes-student-work/steve",

  // student work - food-tray
  "/food-tray-student-work",
  "/food-tray-student-work/alan",
  "/food-tray-student-work/allison",
  "/food-tray-student-work/damon",
  "/food-tray-student-work/echo",
  "/food-tray-student-work/iris",
  "/food-tray-student-work/kevin",
  "/food-tray-student-work/leah-b",
  "/food-tray-student-work/skyler",
  "/food-tray-student-work/steve",

  // student work - small-object-stands
  "/small-object-stands-student-work",

  // individual student pages
  "/alan",
  "/allison",
  "/damon",
  "/echo",
  "/iris",
  "/kevin",
  "/leah-b",
  "/skyler",
  "/steve",

  // miscellaneous
  "/developer-tools",
  "/education-tools-and-materials",
  "/markdown",
  "/p5js-resources",
  "/p5js-resources/p5js-tutorials",
  "/saw-rasp",
  "/software-libraries",
];

async function fetchAndConvert(pagePath: string): Promise<"ok" | "404" | "error"> {
  const url = `${BASE_URL}${pagePath}/`;
  try {
    const response = await fetch(url);
    if (response.status === 404) {
      return "404";
    }
    if (!response.ok) {
      console.error(`  HTTP ${response.status} for ${pagePath}`);
      return "error";
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Extract title
    let title = $("title").text();
    title = title
      .replace(/\s*[-–—]\s*Oliver'?s?\s*Notes$/i, "")
      .replace(/\s*[-–—]\s*Oliver Steele$/i, "")
      .trim();
    if (!title) title = $("h1").first().text().trim() || "Untitled";

    // Extract main content
    const main = $("main").length > 0 ? $("main") : $("body");
    main.find("nav").remove();
    main.find("footer").remove();
    main.find(".breadcrumb").remove();
    main.find("h1").first().remove();

    // Rewrite relative links
    main.find("a[href]").each((_i, el) => {
      const href = $(el).attr("href");
      if (href) {
        $(el).attr("href", resolveLink(href, pagePath));
      }
    });

    main.find("img[src]").each((_i, el) => {
      const src = $(el).attr("src");
      if (src && !src.startsWith("http")) {
        $(el).attr("src", resolveLink(src, pagePath));
      }
    });

    const mainHtml = main.html();
    if (!mainHtml || mainHtml.trim().length < 10) {
      console.warn(`  Empty content for ${pagePath}`);
      return "error";
    }

    let markdown = turndown.turndown(mainHtml);
    markdown = markdown.replace(/\n{3,}/g, "\n\n").trim();

    // Compute layout path
    const segments = pagePath.split("/").filter(Boolean);
    const depth = segments.length;
    const layoutPath = "../".repeat(depth + 1) + "layouts/BaseLayout.astro";

    const content = [
      "---",
      `title: ${JSON.stringify(title)}`,
      `layout: ${layoutPath}`,
      "---",
      "",
      markdown,
      "",
    ].join("\n");

    const outPath = path.join(SRC_PAGES, ...segments, "index.md");
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, content);

    return "ok";
  } catch (err) {
    console.error(`  Error fetching ${pagePath}:`, err);
    return "error";
  }
}

// Main
console.log(`Fetching ${PAGES_TO_FETCH.length} pages from live site...`);

let fetched = 0;
let notFound = 0;
let errors = 0;
const notFoundPages: string[] = [];

// Process in batches of 5 to avoid overwhelming the server
for (let i = 0; i < PAGES_TO_FETCH.length; i += 5) {
  const batch = PAGES_TO_FETCH.slice(i, i + 5);
  const results = await Promise.all(batch.map((p) => fetchAndConvert(p)));

  for (let j = 0; j < results.length; j++) {
    const result = results[j];
    const page = batch[j];
    if (result === "ok") {
      fetched++;
    } else if (result === "404") {
      notFound++;
      notFoundPages.push(page);
    } else {
      errors++;
    }
  }

  if ((i + 5) % 20 === 0 || i + 5 >= PAGES_TO_FETCH.length) {
    console.log(`  Progress: ${Math.min(i + 5, PAGES_TO_FETCH.length)}/${PAGES_TO_FETCH.length}`);
  }
}

console.log(`\nDone: ${fetched} fetched, ${notFound} not found, ${errors} errors`);
if (notFoundPages.length > 0) {
  console.log(`\n404 pages (skipped):`);
  for (const p of notFoundPages) {
    console.log(`  ${p}`);
  }
}
