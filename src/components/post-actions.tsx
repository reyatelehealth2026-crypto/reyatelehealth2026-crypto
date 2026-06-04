"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Props {
  id: string;
  status: string;
  suggestedAt: string | null;
  scheduledAt: string | null;
}

/** Converts an ISO string to a value for <input type="datetime-local">. */
function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const off = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - off).toISOString().slice(0, 16);
}

export function PostActions({ id, status, suggestedAt, scheduledAt }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [when, setWhen] = useState(
    toLocalInput(scheduledAt ?? suggestedAt),
  );

  async function call(path: string, body?: unknown) {
    setBusy(true);
    setError(null);
    const res = await fetch(path, {
      method: "POST",
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    setBusy(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "การดำเนินการล้มเหลว");
      return false;
    }
    router.refresh();
    return true;
  }

  const canApprove = status === "DRAFT";
  const canSchedule = status === "APPROVED" || status === "FAILED";
  const canCancel = ["DRAFT", "APPROVED", "SCHEDULED", "FAILED"].includes(status);

  return (
    <Card>
      <CardHeader>
        <CardTitle>การดำเนินการ</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {canApprove && (
            <Button onClick={() => call(`/api/posts/${id}/approve`)} disabled={busy}>
              อนุมัติ
            </Button>
          )}
          {canCancel && (
            <Button
              variant="destructive"
              onClick={() => call(`/api/posts/${id}/cancel`)}
              disabled={busy}
            >
              ยกเลิก
            </Button>
          )}
        </div>

        {canSchedule && (
          <div className="space-y-2">
            <label className="text-sm font-medium">ตั้งเวลาเผยแพร่</label>
            <div className="flex flex-wrap items-center gap-2">
              <Input
                type="datetime-local"
                value={when}
                onChange={(e) => setWhen(e.target.value)}
                className="w-auto"
              />
              <Button
                onClick={() =>
                  call(`/api/posts/${id}/schedule`, {
                    scheduledAt: new Date(when).toISOString(),
                  })
                }
                disabled={busy || !when}
              >
                ตั้งเวลา
              </Button>
            </div>
          </div>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}
      </CardContent>
    </Card>
  );
}
