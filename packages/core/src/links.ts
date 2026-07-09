import type { Root } from 'mdast';
import { toString as mdastToString } from 'mdast-util-to-string';
import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import { unified } from 'unified';
import { visit } from 'unist-util-visit';

const processor = unified().use(remarkParse).use(remarkGfm);

export interface RawLink {
  /** The href exactly as written, e.g. "/model/author.md". */
  url: string;
  /** The link's visible text (display hint only). */
  label: string;
}

export interface BodyAnalysis {
  /**
   * Every markdown link + reference definition in the body. Because we parse to
   * an AST, fenced code (```cypher ...```) and inline code (`...`) are `code`/
   * `inlineCode` nodes and are NEVER reported here - so Cypher and code samples
   * that merely contain bracket/paren syntax produce zero edges, by construction.
   */
  links: RawLink[];
  /** Plaintext of the body (for search / AI retrieval). */
  text: string;
}

export function analyzeBody(body: string): BodyAnalysis {
  const tree = processor.parse(body) as Root;
  const links: RawLink[] = [];
  visit(tree, (node) => {
    if (node.type === 'link') {
      links.push({ url: node.url, label: mdastToString(node) });
    } else if (node.type === 'definition') {
      links.push({ url: node.url, label: node.label ?? node.identifier });
    }
  });
  return { links, text: mdastToString(tree) };
}
