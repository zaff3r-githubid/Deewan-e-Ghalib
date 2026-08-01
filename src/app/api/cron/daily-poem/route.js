import { NextResponse } from "next/server";
import { db, getTodayPoem } from "@/lib/db";
import { sendDailyPoemEmail } from "@/lib/email";

export async function POST(request) {
  return handleRequest(request);
}

export async function GET(request) {
  return handleRequest(request);
}

async function handleRequest(request) {
  try {
    // 1. Authorize CRON Request
    const authHeader = request.headers.get("authorization");
    const { searchParams } = new URL(request.url);
    const secretQuery = searchParams.get("secret");

    const expectedSecret = process.env.CRON_SECRET;
    const isDev = process.env.NODE_ENV !== "production";

    // In production, require standard Bearer auth or match query secret
    if (!isDev && expectedSecret) {
      const authSecret = authHeader ? authHeader.replace("Bearer ", "") : null;
      if (authSecret !== expectedSecret && secretQuery !== expectedSecret) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    // 2. Retrieve Today's Poem (Async)
    const poemData = await getTodayPoem();
    if (!poemData) {
      return NextResponse.json(
        { error: "No poetry data available in the database." },
        { status: 404 }
      );
    }

    const todayStr = new Date().toISOString().split("T")[0];

    // 3. Check if already sent (Async)
    const queueEntryRes = await db.execute({
      sql: "SELECT sent FROM daily_queue WHERE scheduled_date = ?",
      args: [todayStr],
    });
    const queueEntry = queueEntryRes.rows[0];

    if (queueEntry && Number(queueEntry.sent) === 1) {
      return NextResponse.json({
        success: true,
        message: "Today's poem has already been sent to all subscribers.",
        poem: poemData.ghazal.title,
      });
    }

    // 4. Fetch Active Subscribers (Async)
    const subscribersRes = await db.execute("SELECT email, token FROM subscribers WHERE status = 'active'");
    const subscribers = subscribersRes.rows.map((row) => ({ ...row }));

    if (subscribers.length === 0) {
      // Mark as sent anyway, since there are no subscribers
      await db.execute({
        sql: "UPDATE daily_queue SET sent = 1 WHERE scheduled_date = ?",
        args: [todayStr],
      });

      return NextResponse.json({
        success: true,
        message: "No active subscribers found. Queue marked as sent.",
        poem: poemData.ghazal.title,
      });
    }

    // 5. Dispatch Emails
    console.log(
      `Sending Poem of the Day "${poemData.ghazal.title}" to ${subscribers.length} subscribers...`
    );

    const protocol = request.headers.get("x-forwarded-proto") || "http";
    const host = request.headers.get("host") || "localhost:3033";
    const baseUrl = `${protocol}://${host}`;

    let successCount = 0;
    let failCount = 0;

    for (const sub of subscribers) {
      try {
        const result = await sendDailyPoemEmail(sub.email, sub.token, poemData, baseUrl);
        if (result.success) {
          successCount++;
        } else {
          failCount++;
        }
      } catch (err) {
        console.error(`Failed to send daily email to ${sub.email}:`, err);
        failCount++;
      }
    }

    // 6. Mark Queue Entry as Sent
    await db.execute({
      sql: "UPDATE daily_queue SET sent = 1 WHERE scheduled_date = ?",
      args: [todayStr],
    });

    return NextResponse.json({
      success: true,
      message: `Daily poem processed.`,
      stats: {
        totalSubscribers: subscribers.length,
        sentSuccessfully: successCount,
        failed: failCount,
      },
      poem: poemData.ghazal.title,
    });
  } catch (error) {
    console.error("Cron Daily Poem Error:", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
