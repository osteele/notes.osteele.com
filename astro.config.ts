import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import remarkDemoteHeadings from "./remark-demote-headings.mjs";

export default defineConfig({
  integrations: [mdx()],
  trailingSlash: "always",
  build: {
    format: "directory",
  },
  markdown: {
    remarkPlugins: [remarkDemoteHeadings],
    shikiConfig: {
      theme: "github-light",
    },
  },
});
