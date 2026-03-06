import { visit } from "unist-util-visit";

/** Remark plugin that demotes all headings by one level (h1→h2, h2→h3, etc.)
 * since the layout already renders the page title as h1. */
export default function remarkDemoteHeadings() {
  return (tree) => {
    visit(tree, "heading", (node) => {
      if (node.depth < 6) {
        node.depth += 1;
      }
    });
  };
}
