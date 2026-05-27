import { defineConfig } from "astro/config";
import path from "node:path";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import remarkToc from "./remark-toc.mjs";
import remarkDemoteHeadings from "./remark-demote-headings.mjs";
import {
  buildPublicScripts,
  devScriptsCacheRoot,
  publicScriptsSourceRoot,
} from "./scripts/build-public-scripts";

// Vite plugin: during `astro dev`, build the TS public scripts into a cache
// directory under .astro/ and serve them from there. Keeps generated .js out
// of public/, which would otherwise look like editable source.
function publicScriptsPlugin() {
  let building = false;

  async function rebuild() {
    if (building) return;
    building = true;
    try {
      await buildPublicScripts(devScriptsCacheRoot);
    } finally {
      building = false;
    }
  }

  return {
    name: "public-scripts",
    apply: "serve" as const,
    async configureServer(server: any) {
      await rebuild();
      server.watcher.add(path.join(publicScriptsSourceRoot, "**/*.ts"));
      const rebuildAndReload = async (file: string) => {
        if (!file.startsWith(publicScriptsSourceRoot) || file.endsWith(".d.ts")) return;
        await rebuild();
        server.ws.send({ type: "full-reload" });
      };
      server.watcher.on("add", rebuildAndReload);
      server.watcher.on("change", rebuildAndReload);
      server.watcher.on("unlink", rebuildAndReload);

      server.middlewares.use(async (req: any, res: any, next: any) => {
        const urlPath = decodeURIComponent((req.url || "").split("?")[0]);
        if (!urlPath.endsWith(".js")) return next();
        const filePath = path.join(devScriptsCacheRoot, urlPath);
        if (!filePath.startsWith(devScriptsCacheRoot)) return next();
        try {
          const s = await stat(filePath);
          if (!s.isFile()) return next();
        } catch {
          return next();
        }
        res.setHeader("Content-Type", "application/javascript; charset=utf-8");
        res.setHeader("Cache-Control", "no-cache");
        createReadStream(filePath).pipe(res);
      });
    },
  };
}

// Astro integration: after `astro build`, emit the compiled public scripts
// directly into dist/, alongside Astro's output. No public/ staging step.
function publicScriptsIntegration() {
  return {
    name: "public-scripts",
    hooks: {
      "astro:build:done": async ({ dir }: { dir: URL }) => {
        await buildPublicScripts(fileURLToPath(dir));
      },
    },
  };
}

export default defineConfig({
  site: "https://notes.osteele.com",
  integrations: [mdx(), sitemap(), publicScriptsIntegration()],
  trailingSlash: "always",
  build: {
    format: "directory",
  },
  vite: {
    plugins: [publicScriptsPlugin()],
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
