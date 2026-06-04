"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Page {
  id: string;
  name: string;
}

export default function FacebookSettingsPage() {
  const router = useRouter();
  const [pages, setPages] = useState<Page[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Surface query params from the OAuth redirect.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("connected")) setStatus("เชื่อมต่อบัญชีสำเร็จ เลือกเพจด้านล่าง");
    if (params.get("error")) setError(`เชื่อมต่อไม่สำเร็จ: ${params.get("error")}`);
  }, []);

  async function loadPages() {
    setError(null);
    const res = await fetch("/api/meta/pages/select");
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "โหลดรายชื่อเพจไม่สำเร็จ — โปรดเชื่อมต่อบัญชีก่อน");
      return;
    }
    const { pages } = await res.json();
    setPages(pages);
  }

  useEffect(() => {
    loadPages();
  }, []);

  async function selectPage() {
    setError(null);
    const res = await fetch("/api/meta/pages/select", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pageId: selected }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "เลือกเพจไม่สำเร็จ");
      return;
    }
    setStatus("บันทึกเพจที่เลือกเรียบร้อย");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">เชื่อมต่อ Facebook Page</h1>

      <Card>
        <CardHeader>
          <CardTitle>1. เชื่อมต่อบัญชี</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            เชื่อมต่อบัญชี Facebook ที่ดูแลเพจ เพื่อให้ระบบโพสต์แทนได้
          </p>
          <a href="/api/meta/oauth/start">
            <Button>เชื่อมต่อกับ Facebook</Button>
          </a>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>2. เลือกเพจ</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {pages.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              ยังไม่มีรายชื่อเพจ — เชื่อมต่อบัญชีก่อน แล้วกดโหลดใหม่
            </p>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <select
                className="h-10 rounded-md border border-input bg-transparent px-3 text-sm"
                value={selected}
                onChange={(e) => setSelected(e.target.value)}
              >
                <option value="">— เลือกเพจ —</option>
                {pages.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <Button onClick={selectPage} disabled={!selected}>
                บันทึกเพจนี้
              </Button>
            </div>
          )}
          <Button variant="outline" size="sm" onClick={loadPages}>
            โหลดรายชื่อเพจใหม่
          </Button>
        </CardContent>
      </Card>

      {status && <p className="text-sm text-green-700 dark:text-green-400">{status}</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
