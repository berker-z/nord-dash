// Google Calendar event descriptions arrive as HTML fragments
// (<ol><li>…</li></ol>, <br>, entities). Convert them to readable plain
// text before rendering — we never want to inject calendar HTML into the DOM.
export const htmlToText = (html: string): string => {
  if (!html) return "";
  if (!/[<&]/.test(html)) return html;

  const normalized = html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<li[^>]*>/gi, "• ")
    .replace(/<\/li>/gi, "\n")
    .replace(/<\/(p|div|ol|ul|h[1-6])>/gi, "\n");

  const doc = new DOMParser().parseFromString(normalized, "text/html");
  const text = doc.body.textContent || "";
  return text.replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
};
