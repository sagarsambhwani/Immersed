import React from 'react';
import { User, Sparkles } from 'lucide-react';

export default function MessageItem({ message }) {
  const isUser = message.role === 'user';

  // Helper to parse inline elements (code, bold, italics) hierarchically
  const parseInlineElements = (text) => {
    if (!text) return "";

    // 1. Split by inline backticks: `code`
    const codeSegments = text.split(/(`[^`]+`)/g);

    return codeSegments.map((segment, segIdx) => {
      if (segment.startsWith('`') && segment.endsWith('`')) {
        return (
          <code key={`code-${segIdx}`}>
            <span style={{ color: 'var(--accent-purple)' }}>
              {segment.slice(1, -1)}
            </span>
          </code>
        );
      }

      // 2. For non-code text, split by double asterisks: **bold**
      const boldSegments = segment.split(/(\*\*[^*]+\*\*)/g);

      return boldSegments.map((boldSeg, boldIdx) => {
        if (boldSeg.startsWith('**') && boldSeg.endsWith('**')) {
          return (
            <strong key={`bold-${segIdx}-${boldIdx}`} style={{ fontWeight: '700' }}>
              <span style={{ color: isUser ? '#2e1065' : '#1e293b' }}>
                {boldSeg.slice(2, -2)}
              </span>
            </strong>
          );
        }

        // 3. For remaining text, split by single asterisk: *italics*
        const italicSegments = boldSeg.split(/(\*[^*]+\*)/g);

        return italicSegments.map((italicSeg, italicIdx) => {
          if (italicSeg.startsWith('*') && italicSeg.endsWith('*') && italicSeg.length > 2) {
            return (
              <em key={`italic-${segIdx}-${boldIdx}-${italicIdx}`} style={{ fontStyle: 'italic' }}>
                {italicSeg.slice(1, -1)}
              </em>
            );
          }
          return italicSeg;
        });
      });
    });
  };

  const renderTable = (rows, key) => {
    if (rows.length === 0) return null;
    const headers = rows[0];
    const dataRows = rows.slice(1);
    
    return (
      <div key={key} style={{ margin: '16px 0', overflowX: 'auto', borderRadius: '12px', border: '1px solid rgba(124, 58, 237, 0.08)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem', background: '#ffffff' }}>
          <thead>
            <tr style={{ background: 'var(--accent-purple-light)', borderBottom: '2px solid rgba(124, 58, 237, 0.1)' }}>
              {headers.map((cell, idx) => (
                <th key={`th-${idx}`} style={{ padding: '10px 14px', fontWeight: '600', color: 'var(--accent-purple)', textAlign: 'left', borderRight: '1px solid rgba(124, 58, 237, 0.06)' }}>
                  {parseInlineElements(cell)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dataRows.map((row, rIdx) => (
              <tr key={`tr-${rIdx}`} style={{ borderBottom: '1px solid rgba(124, 58, 237, 0.04)', background: rIdx % 2 === 1 ? 'rgba(240, 243, 250, 0.3)' : '#ffffff' }}>
                {row.map((cell, cIdx) => (
                  <td key={`td-${cIdx}`} style={{ padding: '10px 14px', color: 'var(--text-secondary)', borderRight: '1px solid rgba(124, 58, 237, 0.04)' }}>
                    {parseInlineElements(cell)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // Self-contained parser to convert simple Markdown structures to React elements safely
  const renderFormattedContent = (text) => {
    if (!text) return null;

    // Split by code blocks: ```code```
    const parts = text.split(/(```[\s\S]*?```)/g);

    return parts.map((part, index) => {
      // If code block
      if (part.startsWith('```') && part.endsWith('```')) {
        const rawContent = part.slice(3, -3).trim();
        const lines = rawContent.split('\n');
        
        // Detect language identifier if present
        let lang = '';
        if (lines[0] && lines[0].length < 15 && !lines[0].includes(' ') && !lines[0].includes('(')) {
          lang = lines.shift();
        }
        
        const codeText = lines.join('\n');

        return (
          <pre key={index} className="code-block">
            {lang && <div className="code-lang-tag" style={{ fontSize: '0.7rem', opacity: 0.5, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{lang}</div>}
            <code>{codeText}</code>
          </pre>
        );
      }

      // Process line-by-line for paragraphs, list items, and headers
      const lines = part.split('\n');
      const elements = [];
      let listItems = [];
      let tableRows = [];

      lines.forEach((line, lIdx) => {
        const trimmed = line.trim();
        const isBullet = trimmed.startsWith('- ') || trimmed.startsWith('* ');
        const isTableRow = trimmed.startsWith('|') && trimmed.endsWith('|');
        const isHR = trimmed === '---' || trimmed === '***' || trimmed === '___';
        
        // Check for headers: h1, h2, h3
        const isH3 = trimmed.startsWith('### ');
        const isH2 = trimmed.startsWith('## ') && !isH3;
        const isH1 = trimmed.startsWith('# ') && !isH2 && !isH3;

        // If it's a table row, accumulate it
        if (isTableRow) {
          if (listItems.length > 0) {
            elements.push(
              <ul key={`ul-${lIdx}`} style={{ margin: '10px 0 14px 20px', listStyleType: 'disc', color: 'var(--text-secondary)' }}>
                {listItems}
              </ul>
            );
            listItems = [];
          }

          const isDivider = trimmed.replace(/[|:\s-]/g, '').length === 0;
          if (!isDivider) {
            const cells = trimmed.split('|').slice(1, -1).map(c => c.trim());
            tableRows.push(cells);
          }
          return;
        }

        // If it's NOT a table row, flush accumulated table rows
        if (tableRows.length > 0) {
          elements.push(renderTable(tableRows, `table-${lIdx}`));
          tableRows = [];
        }

        // If it's a horizontal rule, render it
        if (isHR) {
          if (listItems.length > 0) {
            elements.push(
              <ul key={`ul-${lIdx}`} style={{ margin: '10px 0 14px 20px', listStyleType: 'disc', color: 'var(--text-secondary)' }}>
                {listItems}
              </ul>
            );
            listItems = [];
          }
          elements.push(<hr key={`hr-${lIdx}`} style={{ border: 'none', borderTop: '1px solid rgba(124, 58, 237, 0.08)', margin: '16px 0' }} />);
          return;
        }

        if (isBullet) {
          const bulletText = trimmed.slice(2);
          listItems.push(<li key={`li-${lIdx}`} style={{ marginBottom: '6px' }}>{parseInlineElements(bulletText)}</li>);
        } else {
          // If we had accumulated bullets, render the list block
          if (listItems.length > 0) {
            elements.push(
              <ul key={`ul-${lIdx}`} style={{ margin: '10px 0 14px 20px', listStyleType: 'disc', color: 'var(--text-secondary)' }}>
                {listItems}
              </ul>
            );
            listItems = [];
          }

          if (isH3) {
            elements.push(
              <h4 key={`h3-${lIdx}`} style={{ fontSize: '1.05rem', fontWeight: '600', color: 'var(--accent-purple)', margin: '20px 0 8px 0' }}>
                {parseInlineElements(trimmed.slice(4))}
              </h4>
            );
          } else if (isH2) {
            elements.push(
              <h3 key={`h2-${lIdx}`} style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--accent-purple)', margin: '24px 0 10px 0' }}>
                {parseInlineElements(trimmed.slice(3))}
              </h3>
            );
          } else if (isH1) {
            elements.push(
              <h2 key={`h1-${lIdx}`} style={{ fontSize: '1.35rem', fontWeight: '700', color: 'var(--accent-purple)', margin: '28px 0 12px 0' }}>
                {parseInlineElements(trimmed.slice(2))}
              </h2>
            );
          } else if (trimmed) {
            elements.push(
              <p key={`p-${lIdx}`} style={{ marginBottom: '12px', lineHeight: '1.65' }}>
                {parseInlineElements(line)}
              </p>
            );
          }
        }
      });

      // Render any remaining list items at the end
      if (listItems.length > 0) {
        elements.push(
          <ul key={`ul-end`} style={{ margin: '10px 0 14px 20px', listStyleType: 'disc', color: 'var(--text-secondary)' }}>
            {listItems}
          </ul>
        );
      }

      // Render any remaining table rows at the end
      if (tableRows.length > 0) {
        elements.push(renderTable(tableRows, `table-end`));
      }

      return <React.Fragment key={index}>{elements}</React.Fragment>;
    });
  };

  return (
    <div className={`message-wrapper ${isUser ? 'user' : 'assistant'}`}>
      <div className="message-avatar">
        {isUser ? <User size={20} /> : <Sparkles size={20} />}
      </div>
      <div className="message-bubble">
        <div className="message-content">
          {renderFormattedContent(message.content)}
        </div>
      </div>
    </div>
  );
}
