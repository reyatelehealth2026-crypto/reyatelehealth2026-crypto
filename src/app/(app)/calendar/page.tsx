import Link from "next/link";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

function fmt(d: Date): string {
  return new Intl.DateTimeFormat("th-TH", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Bangkok",
  }).format(d);
}

export default async function CalendarPage() {
  const posts = await prisma.post.findMany({
    where: {
      status: { in: ["SCHEDULED", "PUBLISHED", "PUBLISHING", "FAILED"] },
    },
    orderBy: [{ scheduledAt: "asc" }, { publishedAt: "asc" }],
    take: 200,
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">ปฏิทินโพสต์</h1>
      <Card>
        <CardHeader>
          <CardTitle>โพสต์ที่ตั้งเวลา / เผยแพร่แล้ว</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {posts.length === 0 && (
            <p className="text-sm text-muted-foreground">ยังไม่มีโพสต์ที่ตั้งเวลา</p>
          )}
          {posts.map((p) => {
            const when = p.publishedAt ?? p.scheduledAt;
            return (
              <Link
                key={p.id}
                href={`/posts/${p.id}`}
                className="flex items-center justify-between gap-4 rounded-md border p-3 hover:bg-muted"
              >
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-1 text-sm">{p.caption}</p>
                  <p className="text-xs text-muted-foreground">
                    {when ? fmt(when) : "—"}
                  </p>
                </div>
                <StatusBadge status={p.status} />
              </Link>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
