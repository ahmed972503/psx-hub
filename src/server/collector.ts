import { clipExcerpt } from "@/lib/intelligence/extract";
import { appUrl } from "@/lib/security";
import { prisma } from "@/server/db";
import { ingestItem } from "@/server/pipeline";

function readTag(block: string, name: string) {
  const cdata = block.match(new RegExp(`<${name}[^>]*>\\s*<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>\\s*</${name}>`, "i"));
  if (cdata) return cdata[1].trim();
  const plain = block.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, "i"));
  return plain?.[1]?.trim() ?? "";
}

function decode(value: string) {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

export function parseFeed(xml: string) {
  const entryMode = /<entry[\s>]/i.test(xml) && !/<item[\s>]/i.test(xml);
  const parts = xml.split(entryMode ? /<entry\b/i : /<item\b/i).slice(1);
  return parts.flatMap((part) => {
    const block = part.split(entryMode ? /<\/entry>/i : /<\/item>/i)[0] ?? part;
    const title = decode(readTag(block, "title"));
    const href = block.match(/<link[^>]*href=["']([^"']+)["']/i)?.[1];
    const link = decode(readTag(block, "link")) || (href ? decode(href) : "");
    const published = readTag(block, "pubDate") || readTag(block, "published") || readTag(block, "updated");
    const description = readTag(block, "description") || readTag(block, "summary") || readTag(block, "content");
    if (!title || !link) return [];
    const parsed = published ? new Date(published) : null;
    return [{
      title,
      link,
      publishedAt: parsed && !Number.isNaN(parsed.getTime()) ? parsed : null,
      excerpt: clipExcerpt(description),
    }];
  });
}

export async function fetchFeed(url: string) {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(12000),
    headers: {
      Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml",
      "User-Agent": `PSXIntelligenceBot/0.1 (+${appUrl()}; public-rss)`,
    },
    redirect: "follow",
  });
  if (!response.ok) throw new Error(`Feed responded HTTP ${response.status}`);
  return parseFeed(await response.text()).slice(0, 20);
}

export async function runCollectors(force = false) {
  const sources = await prisma.source.findMany({ where: { enabled: true }, orderBy: { name: "asc" } });
  const results: { source: string; ok: boolean; message: string }[] = [];
  for (const source of sources) {
    const started = Date.now();
    if (source.type !== "RSS") {
      results.push({ source: source.name, ok: true, message: "Skipped. Only permitted RSS feeds are collected automatically." });
      continue;
    }
    if (!source.url) {
      results.push({ source: source.name, ok: false, message: "RSS source has no URL." });
      continue;
    }
    if (!force && source.lastSuccessAt && Date.now() - source.lastSuccessAt.getTime() < source.pollIntervalSec * 1000) {
      results.push({ source: source.name, ok: true, message: "Skipped until the next poll interval." });
      continue;
    }
    try {
      const items = await fetchFeed(source.url);
      let created = 0;
      for (const item of items) {
        const outcome = await ingestItem({
          sourceId: source.id,
          sourceUrl: item.link,
          headline: item.title,
          excerpt: item.excerpt,
          publishedAt: item.publishedAt,
        });
        if (outcome.created) created += 1;
      }
      await prisma.source.update({
        where: { id: source.id },
        data: { lastSuccessAt: new Date(), lastError: null },
      });
      await prisma.sourceLog.create({
        data: {
          sourceId: source.id,
          ok: true,
          message: `Fetched ${items.length} feed entries. ${created} were new.`,
          latencyMs: Date.now() - started,
          itemCount: created,
        },
      });
      results.push({ source: source.name, ok: true, message: `${created} new of ${items.length} entries.` });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown collector error";
      await prisma.source.update({
        where: { id: source.id },
        data: { lastFailureAt: new Date(), lastError: message.slice(0, 500), errorCount: { increment: 1 } },
      });
      await prisma.sourceLog.create({
        data: { sourceId: source.id, ok: false, message: message.slice(0, 500), latencyMs: Date.now() - started },
      });
      results.push({ source: source.name, ok: false, message });
    }
  }
  return results;
}
