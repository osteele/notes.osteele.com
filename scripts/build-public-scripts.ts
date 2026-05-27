import { mkdir, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const publicScriptsSourceRoot = path.join(rootDir, "src", "public-scripts");

// Build cache used during `astro dev` (served by the Vite middleware in
// astro.config.mjs). Lives under .astro/ so it's already gitignored.
export const devScriptsCacheRoot = path.join(rootDir, ".astro", "public-scripts");

async function findTypeScriptFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      // Directories whose name starts with "_" hold shared modules that are
      // bundled into other entries via import; they are not entry points.
      if (entry.name.startsWith("_")) return [];
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) return findTypeScriptFiles(fullPath);
      if (entry.isFile() && entry.name.endsWith(".ts") && !entry.name.endsWith(".d.ts")) return [fullPath];
      return [];
    }),
  );
  return files.flat();
}

export async function buildPublicScripts(outDir: string): Promise<void> {
  const entryPoints = await findTypeScriptFiles(publicScriptsSourceRoot);
  await mkdir(outDir, { recursive: true });
  await build({
    entryPoints,
    outbase: publicScriptsSourceRoot,
    outdir: outDir,
    bundle: true,
    format: "iife",
    platform: "browser",
    target: "es2020",
    logLevel: "info",
    banner: {
      js: "// AUTO-GENERATED from src/public-scripts/. Do not edit — edits are clobbered by the next build.",
    },
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const outDir = process.argv[2] ? path.resolve(process.argv[2]) : path.join(rootDir, "dist");
  await buildPublicScripts(outDir);
}
