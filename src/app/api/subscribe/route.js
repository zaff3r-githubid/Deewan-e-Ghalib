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
      // Send welcome email
      const welcomeRes = await sendWelcomeEmail(cleanedEmail, res.token);
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
