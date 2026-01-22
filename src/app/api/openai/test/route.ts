import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import OpenAI from "openai";

import { db } from "@/db";
import { openaiConfigs } from "@/db/schema";
import { getUserId } from "@/lib/auth";
import { decryptSecret } from "@/lib/crypto";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = await request.json();
  let apiKey = String(body?.apiKey || "").trim();
  const configId = body?.configId ? Number(body.configId) : null;

  if (configId) {
    const [config] = await db
      .select()
      .from(openaiConfigs)
      .where(and(eq(openaiConfigs.id, configId), eq(openaiConfigs.userId, userId)))
      .limit(1);
    if (config) {
      apiKey = decryptSecret(config.apiKey);
    }
  } else if (!apiKey) {
    const [defaultConfig] = await db
      .select()
      .from(openaiConfigs)
      .where(and(eq(openaiConfigs.isDefault, true), eq(openaiConfigs.userId, userId)))
      .limit(1);
    apiKey = defaultConfig?.apiKey ? decryptSecret(defaultConfig.apiKey) : "";
  }

  if (!apiKey) {
    return NextResponse.json(
      { error: "OpenAI API key is required." },
      { status: 400 }
    );
  }

  try {
    const client = new OpenAI({ apiKey });
    await client.models.list();
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Connection failed." },
      { status: 400 }
    );
  }
}
