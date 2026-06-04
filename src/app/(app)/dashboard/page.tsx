import Link from "next/link";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

const STATUSES = [
  "DRAFT",
  "APPROVED",
  "SCHEDULED",
  "PUBLISHED",
  "FAILED",
] as const;

export default async function DashboardPage() {
  const [grouped, recent, connection] = await Promise.all([
    prisma.post.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.post.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { media: true },
    }),
    prisma.facebookConnection.findUnique({ where: { id: "default" } }),
  ]);

  const counts = Object.fromEntries(
    grouped.map((g) => [g.status, g._count._all]),
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">แดชบอร์ด</h1>
        <Link
          href="/compose"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          + สร้างโพสต์ใหม่
        </Link>
      </div>

      <Card>
        <CardContent className="flex items-center justify-between py-4">
          <div>
            <p className="text-sm text-muted-foreground">เพจที่เชื่อมต่อ</p>
            <p className="font-medium">
              {connection?.pageName ?? "ยังไม่ได้เชื่อมต่อ"}
            </p>
          </div>
          <Link href="/settings/facebook" className="text-sm text-primary underline">
            จัดการการเชื่อมต่อ
          </Link>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {STATUSES.map((s) => (
          <Card key={s}>
            <CardContent className="py-4 text-center">
              <p className="text-3xl font-bold">{counts[s] ?? 0}</p>
              <div className="mt-2 flex justify-center">
                <StatusBadge status={s} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>โพสต์ล่าสุด</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {recent.length === 0 && (
            <p className="text-sm text-muted-foreground">ยังไม่มีโพสต์</p>
          )}
          {recent.map((p) => (
            <Link
              key={p.id}
              href={`/posts/${p.id}`}
              className="flex items-center justify-between gap-4 rounded-md border p-3 hover:bg-muted"
            >
              <span className="line-clamp-1 flex-1 text-sm">{p.caption}</span>
              <StatusBadge status={p.status} />
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
