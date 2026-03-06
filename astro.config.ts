import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import remarkToc from "./remark-toc.mjs";
import remarkDemoteHeadings from "./remark-demote-headings.mjs";

export default defineConfig({
  integrations: [mdx()],
  trailingSlash: "always",
  build: {
    format: "directory",
  },
  markdown: {
    remarkPlugins: [remarkToc, remarkMath, remarkDemoteHeadings],
    rehypePlugins: [rehypeKatex],
    shikiConfig: {
      theme: "github-light",
    },
  },
});
