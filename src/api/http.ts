import { z } from "zod";
import { API_VERSION, drawReading, getCard, listCards, listCardsQuerySchema, listSpreads } from "./core";
import openApiDocument from "../../public/openapi.json";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
  "X-Content-Type-Options": "nosniff",
};
const json = (body: unknown, status = 200, headers: HeadersInit = {}) => new Response(JSON.stringify(body, null, 2), { status, headers: { ...cors, "Content-Type": "application/json; charset=utf-8", ...headers } });
const bad = (status: number, code: string, message: string, details?: unknown) => json({ error: { code, message, ...(details ? { details } : {}) } }, status);
const MAX_BODY_BYTES = 128 * 1024;

async function readJson(request: Request) {
  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) throw Object.assign(new Error("Request body exceeds 128 KB."), { status: 413, code: "BODY_TOO_LARGE" });
  const reader = request.body?.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  if (reader) {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BODY_BYTES) {
        await reader.cancel();
        throw Object.assign(new Error("Request body exceeds 128 KB."), { status: 413, code: "BODY_TOO_LARGE" });
      }
      chunks.push(value);
    }
  }
  const raw = new TextDecoder().decode(Buffer.concat(chunks));
  try { return JSON.parse(raw || "{}"); }
  catch { throw Object.assign(new Error("Request body must be valid JSON."), { status: 400, code: "INVALID_JSON" }); }
}

function zodError(error: z.ZodError) {
  return bad(400, "VALIDATION_ERROR", "The request does not match the API schema.", error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message })));
}

export async function handleTarotApi(request: Request): Promise<Response> {
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  const url = new URL(request.url);
  const origin = url.origin;
  const path = url.pathname.replace(/\/+$/, "") || "/";
  if (path === "/health" && request.method === "GET") return json({ status: "ok", service: "franklin-tarot-api", apiVersion: API_VERSION });
  if (path === "/openapi.json" && request.method === "GET") return json(openApiDocument, 200, { "Cache-Control": "public, max-age=300" });
  if (request.method === "GET" && path === "/api/v1/cards") {
    const parsed = listCardsQuerySchema.safeParse(Object.fromEntries(url.searchParams));
    if (!parsed.success) return zodError(parsed.error);
    return json(listCards(parsed.data, origin));
  }
  const cardMatch = path.match(/^\/api\/v1\/cards\/([^/]+)$/);
  if (request.method === "GET" && cardMatch) {
    let id: string;
    try { id = decodeURIComponent(cardMatch[1]); } catch { return bad(400, "INVALID_CARD_ID", "Card ID is not valid URL encoding."); }
    const locale = url.searchParams.get("locale") ?? "zh-CN";
    const parsedLocale = z.enum(["en", "zh-CN"]).safeParse(locale);
    if (!parsedLocale.success) return bad(400, "VALIDATION_ERROR", "locale must be en or zh-CN.");
    const card = getCard(id, parsedLocale.data, origin);
    return card ? json(card) : bad(404, "CARD_NOT_FOUND", `No card exists with ID '${id}'.`);
  }
  if (request.method === "GET" && path === "/api/v1/spreads") {
    const locale = z.enum(["en", "zh-CN"]).safeParse(url.searchParams.get("locale") ?? "zh-CN");
    if (!locale.success) return bad(400, "VALIDATION_ERROR", "locale must be en or zh-CN.");
    return json({ spreads: listSpreads(locale.data), locale: locale.data });
  }
  if (request.method === "POST" && path === "/api/v1/readings/draw") {
    try { return json(drawReading(await readJson(request), origin)); }
    catch (error) {
      if (error instanceof z.ZodError) return zodError(error);
      return bad(Number((error as any)?.status) || 400, (error as any)?.code || "DRAW_FAILED", (error as Error).message || "The draw could not be completed.");
    }
  }
  if (/^\/api\/v1(?:\/|$)/.test(path)) {
    const allow = path === "/api/v1/readings/draw" ? "GET, POST, OPTIONS" : "GET, OPTIONS";
    return bad(request.method === "GET" || request.method === "POST" ? 404 : 405, request.method === "GET" || request.method === "POST" ? "NOT_FOUND" : "METHOD_NOT_ALLOWED", "No API route matches this request.", { path, allow });
  }
  return bad(404, "NOT_FOUND", "No route matches this request.");
}

export default handleTarotApi;
