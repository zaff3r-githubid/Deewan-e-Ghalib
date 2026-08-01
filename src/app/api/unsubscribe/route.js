import { NextResponse } from "next/server";
import { unsubscribeEmail } from "@/lib/db";

export async function POST(request) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { error: "Missing subscription token." },
        { status: 400 }
      );
    }

    const unsubscribed = await unsubscribeEmail(token);

    if (!unsubscribed) {
      return NextResponse.json(
        { error: "Invalid token or subscription not found." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "You have been successfully unsubscribed from the daily poem newsletter.",
    });
  } catch (error) {
    console.error("API Unsubscribe Error:", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
