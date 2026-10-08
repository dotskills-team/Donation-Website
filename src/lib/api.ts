import { NextRequest, NextResponse } from "next/server";
import { ZodError, type ZodType } from "zod";
import { HttpError } from "@/lib/errors";

export const ok = <T,>(data: T, status = 200) => NextResponse.json({ data }, { status });

export function errorResponse(e: unknown) {
  if (e instanceof HttpError) {
    return NextResponse.json({ error: e.message, details: e.details }, { status: e.status });
  }
  if (e instanceof ZodError) {
    const details: Record<string, string> = {};
    for (const i of e.issues) details[i.path.join(".") || "_"] ??= i.message;
    return NextResponse.json({ error: "Please check the highlighted fields", details }, { status: 400 });
  }
  const err = e as { code?: number; name?: string };
  if (err?.code === 11000) {
    return NextResponse.json({ error: "A record with the same unique value already exists" }, { status: 409 });
  }
  if (err?.name === "CastError" || err?.name === "ValidationError") {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }
  console.error("[api]", e);
  // return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  console.error("[api]", e);
return NextResponse.json(
  {
    error:
      process.env.NODE_ENV === "development"
        ? `Server error: ${(e as Error).message}`
        : "Something went wrong. Please try again.",
  },
  { status: 500 },
);
}

/** Wraps a Route Handler: error mapping + same-origin check for state-changing requests. */
export function route<C = unknown>(fn: (req: NextRequest, ctx: C) => Promise<Response>) {
  return async (req: NextRequest, ctx: C) => {
    try {
      if (!["GET", "HEAD", "OPTIONS"].includes(req.method)) {
        const origin = req.headers.get("origin");
        const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
        if (origin && new URL(origin).host !== host) throw new HttpError(403, "Cross-origin request blocked");
      }
      return await fn(req, ctx);
    } catch (e) {
      return errorResponse(e);
    }
  };
}

export async function parseBody<T>(req: NextRequest, schema: ZodType<T>): Promise<T> {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    throw new HttpError(400, "Invalid request body");
  }
  return schema.parse(json);
}

export function parseQuery<T>(req: NextRequest, schema: ZodType<T>): T {
  const obj: Record<string, string> = {};
  req.nextUrl.searchParams.forEach((v, k) => {
    if (v !== "") obj[k] = v;
  });
  return schema.parse(obj);
}

export function assertId(id: string) {
  if (!/^[a-f\d]{24}$/i.test(id)) throw new HttpError(404, "Not found");
  return id;
}
