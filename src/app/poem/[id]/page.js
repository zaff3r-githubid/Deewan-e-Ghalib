import { db, getPoemById } from "@/lib/db";
import PoemClientView from "../../PoemClientView";
import { notFound } from "next/navigation";

export async function generateStaticParams() {
  const res = await db.execute("SELECT id FROM ghazals");
  return res.rows.map((row) => ({
    id: row.id.toString(),
  }));
}

export default async function PoemDetail({ params }) {
  const resolvedParams = await params;
  const poemId = parseInt(resolvedParams.id, 10);

  if (isNaN(poemId)) {
    notFound();
  }

  const poemData = await getPoemById(poemId);

  if (!poemData) {
    notFound();
  }

  return <PoemClientView poemData={poemData} isArchiveView={true} />;
}
