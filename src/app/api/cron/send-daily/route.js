import { NextResponse } from "next/server";
import { db, getTodayPoem } from "@/lib/db";
import { sendDailyPoemEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

export async function GET(request) {
  // Authorization check using standard CRON_SECRET or Vercel cron headers
  const authHeader = request.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 1. Get today's scheduled poem
    const poemData = await getTodayPoem();
    if (!poemData) {
      return NextResponse.json({ success: true, message: "No poem is loaded or scheduled for today." });
    }

    // 2. Fetch all active subscribers
    const subscribersRes = await db.execute({
      sql: "SELECT email, token FROM subscribers WHERE status = 'active'",
      args: [],
    });
    const subscribers = subscribersRes.rows;

    if (subscribers.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: `No active subscribers. Current daily poem is "${poemData.ghazal.title}".` 
      });
    }

    // 3. Send email to each subscriber
    let successCount = 0;
    let failCount = 0;
    const results = [];
    for (const sub of subscribers) {
      const emailRes = await sendDailyPoemEmail(sub.email, sub.token, poemData);
      if (emailRes.success) {
        successCount++;
      } else {
        failCount++;
      }
      results.push({ email: sub.email, success: emailRes.success, mocked: emailRes.mocked || false });
    }

    // 4. Update the daily queue record for today to mark as sent
    const todayStr = new Date().toISOString().split("T")[0];
    await db.execute({
      sql: "UPDATE daily_queue SET sent = 1 WHERE scheduled_date = ?",
      args: [todayStr],
    });

    return NextResponse.json({
      success: true,
      message: `Emails processed. Sent: ${successCount}, Failed: ${failCount}`,
      poem: poemData.ghazal.title,
      results,
    });
  } catch (error) {
    console.error("Cron daily email endpoint error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
