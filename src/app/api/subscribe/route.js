import { NextResponse } from "next/server";
import { subscribeEmail } from "@/lib/db";
import { sendWelcomeEmail } from "@/lib/email";

export async function POST(request) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { success: false, error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    const cleanedEmail = email.trim().toLowerCase();
    const res = await subscribeEmail(cleanedEmail);

    if (res.success) {
      // Resolve base URL dynamically from request headers
      const protocol = request.headers.get("x-forwarded-proto") || "http";
      const host = request.headers.get("host") || "localhost:3033";
      const baseUrl = `${protocol}://${host}`;

      // Send welcome email
      const welcomeRes = await sendWelcomeEmail(cleanedEmail, res.token, baseUrl);
      return NextResponse.json({
        success: true,
        message: res.isNew 
          ? "Successfully subscribed! A welcome email has been sent." 
          : "You are already subscribed to the daily mailing list.",
        isNew: res.isNew,
        mocked: welcomeRes.mocked || false,
      });
    }

    return NextResponse.json(
      { success: false, error: "Failed to subscribe. Please try again." },
      { status: 500 }
    );
  } catch (error) {
    console.error("Subscription API error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
