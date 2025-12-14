import { NextResponse } from "next/server";
import { getBotMessagesToUser } from "@/lib/slack";

export async function GET(request: Request) {
  try {
    const data = await getBotMessagesToUser({ limit: 10 });
    return NextResponse.json(data);
  } catch (err: any) {
    console.error("API /api/slack/messages error:", err);
    return NextResponse.json(
      { success: false, error: String(err?.message || err) },
      { status: 500 }
    );
  }
}
