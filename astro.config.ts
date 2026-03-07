import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import remarkToc from "./remark-toc.mjs";
import remarkDemoteHeadings from "./remark-demote-headings.mjs";

export default defineConfig({
  site: "https://notes.osteele.com",
  integrations: [mdx(), sitemap()],
  trailingSlash: "always",
  build: {
    format: "directory",
  },
  markdown: {
    remarkPlugins: [remarkToc, remarkMath, remarkDemoteHeadings],
    rehypePlugins: [rehypeKatex],
    shikiConfig: {
      themes: {
        light: "github-light",
        dark: "github-dark",
      },
    },
  },
});
