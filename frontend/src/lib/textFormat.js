export const hasArabic = (text = "") => /[\u0600-\u06FF]/.test(text);

const escapeHtml = (unsafeText) =>
  unsafeText
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const applyInlineFormatting = (line) => {
  let formatted = line;
  formatted = formatted.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  formatted = formatted.replace(/\*(.*?)\*/g, "<em>$1</em>");
  return formatted;
};

export const renderStructuredText = (text = "") => {
  const safeText = escapeHtml(text);
  const lines = safeText.split("\n");
  const htmlParts = [];
  let inList = false;

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (trimmed.startsWith("- ")) {
      if (!inList) {
        htmlParts.push("<ul class='list-disc ps-6 space-y-1'>");
        inList = true;
      }
      htmlParts.push(`<li>${applyInlineFormatting(trimmed.slice(2))}</li>`);
      return;
    }

    if (inList) {
      htmlParts.push("</ul>");
      inList = false;
    }

    if (trimmed) {
      htmlParts.push(`<p class='mb-2'>${applyInlineFormatting(trimmed)}</p>`);
    }
  });

  if (inList) {
    htmlParts.push("</ul>");
  }

  return htmlParts.join("");
};
