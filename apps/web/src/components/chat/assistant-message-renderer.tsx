import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'

export default function AssistantMessageRenderer({
  content,
}: {
  content: string
}) {
  return (
    <div className="px-2 w-full text-sm">
      <Markdown
        components={{
          // Headings
          h1: ({ children }) => (
            <h1 className="text-2xl font-semibold mb-4 mt-6 text-foreground">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-xl font-semibold mb-3 mt-5 text-foreground">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-lg font-semibold mb-2 mt-4 text-foreground">
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-base font-semibold mb-2 mt-3 text-foreground">
              {children}
            </h4>
          ),
          h5: ({ children }) => (
            <h5 className="text-sm font-semibold mb-1 mt-2 text-foreground">
              {children}
            </h5>
          ),

          // Paragraphs
          p: ({ children }) => (
            <p className="mb-4 leading-7 text-sm text-gray-900 dark:text-gray-100">
              {children}
            </p>
          ),

          // Lists
          ul: ({ children }) => (
            <ul className="list-disc list-inside mb-4 space-y-1 text-sm">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside mb-4 space-y-1 text-sm">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="text-sm text-gray-900 dark:text-gray-100">
              {children}
            </li>
          ),

          // Code
          code: ({ children, className, ...props }) => {
            const isInline = !className || !className.includes('language-')
            if (isInline) {
              return (
                <code
                  className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono text-muted-foreground"
                  {...props}
                >
                  {children}
                </code>
              )
            }
            return (
              <code
                className="block bg-muted p-4 rounded-lg text-xs font-mono overflow-x-auto text-muted-foreground"
                {...props}
              >
                {children}
              </code>
            )
          },
          pre: ({ children }) => (
            <pre className="bg-muted p-4 rounded-lg mb-4 overflow-x-auto text-xs">
              {children}
            </pre>
          ),

          // Blockquotes
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-border pl-4 py-2 mb-4 italic text-sm text-muted-foreground">
              {children}
            </blockquote>
          ),

          // Links
          a: ({ children, href, ...props }) => (
            <a
              href={href}
              className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
              target="_blank"
              rel="noopener noreferrer"
              {...props}
            >
              {children}
            </a>
          ),

          // Emphasis
          em: ({ children }) => <em className="italic text-sm">{children}</em>,
          strong: ({ children }) => (
            <strong className="font-semibold text-sm">{children}</strong>
          ),

          // Tables
          table: ({ children }) => (
            <div className="overflow-x-auto mb-4">
              <table className="min-w-full border border-border text-sm">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-muted">{children}</thead>
          ),
          tbody: ({ children }) => (
            <tbody className="bg-muted">{children}</tbody>
          ),
          tr: ({ children }) => (
            <tr className="border-b border-border">{children}</tr>
          ),
          th: ({ children }) => (
            <th className="px-4 py-2 text-left text-sm font-semibold text-foreground">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-4 py-2 text-sm text-foreground">{children}</td>
          ),

          // Horizontal rule
          hr: () => <hr className="my-6 border-border" />,
        }}
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
      >
        {content}
      </Markdown>
    </div>
  )
}
