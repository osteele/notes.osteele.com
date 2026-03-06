import { visit } from "unist-util-visit";
import { toString } from "mdast-util-to-string";
import GithubSlugger from "github-slugger";

/**
 * Remark plugin that generates a table of contents from h1 headings
 * and inserts it before the first heading. Runs before remarkDemoteHeadings
 * so it sees the original heading levels.
 */
export default function remarkToc() {
  return (tree) => {
    const slugger = new GithubSlugger();
    const headings = [];
    let firstHeadingIndex = -1;

    // Collect h1 headings and find the first heading's position
    for (let i = 0; i < tree.children.length; i++) {
      const node = tree.children[i];
      if (node.type === "heading" && node.depth === 1) {
        const text = toString(node);
        // Generate slug matching Astro's rehype-slug (uses github-slugger)
        const slug = slugger.slug(text);
        headings.push({ text, slug });
        if (firstHeadingIndex === -1) {
          firstHeadingIndex = i;
        }
      }
    }

    // Only insert ToC if there are 2+ headings
    if (headings.length < 2 || firstHeadingIndex === -1) return;

    const tocHtml = [
      { type: "html", value: '<nav class="toc">' },
      {
        type: "list",
        ordered: false,
        spread: false,
        children: headings.map((h) => ({
          type: "listItem",
          spread: false,
          children: [
            {
              type: "paragraph",
              children: [
                {
                  type: "link",
                  url: `#${h.slug}`,
                  children: [{ type: "text", value: h.text }],
                },
              ],
            },
          ],
        })),
      },
      { type: "html", value: "</nav>" },
    ];

    tree.children.splice(firstHeadingIndex, 0, ...tocHtml);
  };
}
