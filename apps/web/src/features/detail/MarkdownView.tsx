import { useMemo } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import remarkGfm from 'remark-gfm';
import { cn } from '../../lib/cn';
import { resolveLink } from '../../lib/resolveLink';

// Allow highlight.js class names (added by rehype-highlight) to survive sanitize.
const schema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    code: [...(defaultSchema.attributes?.code ?? []), 'className'],
    span: [...(defaultSchema.attributes?.span ?? []), 'className'],
  },
};

export function MarkdownView({
  body,
  currentDir,
  existingIds,
  onNavigate,
}: {
  body: string;
  currentDir: string;
  existingIds: Set<string>;
  onNavigate: (id: string) => void;
}) {
  const components = useMemo<Components>(
    () => ({
      a({ href, children }) {
        const r = resolveLink(href ?? '', currentDir);
        if (r.kind === 'node') {
          const exists = existingIds.has(r.id);
          return (
            <a
              href={`#/node/${encodeURIComponent(r.id)}`}
              onClick={(e) => {
                e.preventDefault();
                if (exists) onNavigate(r.id);
              }}
              className={cn('okapi-link', !exists && 'okapi-link-broken')}
              title={exists ? undefined : 'Not yet written'}
            >
              {children}
            </a>
          );
        }
        if (r.kind === 'asset') {
          return (
            <a href={`/api/files/${r.path}`} target="_blank" rel="noreferrer">
              {children}
            </a>
          );
        }
        return (
          <a href={r.href} target="_blank" rel="noreferrer">
            {children}
          </a>
        );
      },
      img({ src, alt }) {
        const r = typeof src === 'string' ? resolveLink(src, currentDir) : null;
        const finalSrc =
          r?.kind === 'asset' ? `/api/files/${r.path}` : typeof src === 'string' ? src : '';
        // biome-ignore lint/a11y/useAltText: alt is forwarded from source markdown
        return <img src={finalSrc} alt={alt ?? ''} loading="lazy" />;
      },
    }),
    [currentDir, existingIds, onNavigate],
  );

  return (
    <div className="prose prose-okapi max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight, [rehypeSanitize, schema]]}
        components={components}
      >
        {body}
      </ReactMarkdown>
    </div>
  );
}
