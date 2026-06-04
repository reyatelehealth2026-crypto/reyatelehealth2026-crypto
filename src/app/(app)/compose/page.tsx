"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ComposePage() {
  const router = useRouter();
  const [topic, setTopic] = useState("");
  const [tone, setTone] = useState("");
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Draft fields (editable after generation)
  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [altText, setAltText] = useState("");
  const [warnings, setWarnings] = useState<string[]>([]);
  const [linkUrl, setLinkUrl] = useState("");
  const [suggestedAt, setSuggestedAt] = useState<string | undefined>();
  const [geminiModel, setGeminiModel] = useState<string | undefined>();
  const [geminiRaw, setGeminiRaw] = useState<unknown>();
  const [mediaId, setMediaId] = useState<string | undefined>();
  const [mediaUrl, setMediaUrl] = useState<string | undefined>();

  async function generate() {
    setGenerating(true);
    setError(null);
    const res = await fetch("/api/gemini/drafts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic, tone: tone || undefined, linkUrl: linkUrl || undefined }),
    });
    setGenerating(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "สร้างร่างไม่สำเร็จ");
      return;
    }
    const { draft, model, raw } = await res.json();
    setCaption(draft.caption);
    setHashtags((draft.hashtags ?? []).join(" "));
    setAltText(draft.altText ?? "");
    setWarnings(draft.warnings ?? []);
    setSuggestedAt(draft.suggestedScheduleTimeIso);
    setGeminiModel(model);
    setGeminiRaw(raw);
  }

  async function uploadImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    const form = new FormData();
    form.set("file", file);
    form.set("altText", altText);
    const res = await fetch("/api/media", { method: "POST", body: form });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "อัปโหลดรูปไม่สำเร็จ");
      return;
    }
    const { media } = await res.json();
    setMediaId(media.id);
    setMediaUrl(media.blobUrl);
  }

  async function save() {
    setSaving(true);
    setError(null);
    const type = mediaId ? "PHOTO" : linkUrl ? "LINK" : "TEXT";
    const res = await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type,
        caption,
        hashtags: hashtags.split(/\s+/).map((h) => h.replace(/^#/, "")).filter(Boolean),
        altText: altText || undefined,
        warnings,
        linkUrl: linkUrl || undefined,
        suggestedAt,
        mediaId,
        geminiModel,
        geminiRaw,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "บันทึกร่างไม่สำเร็จ");
      return;
    }
    const { post } = await res.json();
    router.push(`/posts/${post.id}`);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">สร้างโพสต์ด้วย Gemini</h1>

      <Card>
        <CardHeader>
          <CardTitle>1. บรีฟให้ Gemini</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <label className="text-sm font-medium">หัวข้อ / บรีฟ</label>
            <Textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="เช่น โปรโมชั่นวิตามินซีลด 20% สัปดาห์นี้"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">โทนเสียง (ไม่บังคับ)</label>
            <Input value={tone} onChange={(e) => setTone(e.target.value)} placeholder="เป็นกันเอง" />
          </div>
          <Button onClick={generate} disabled={generating || !topic.trim()}>
            {generating ? "กำลังสร้างร่าง..." : "สร้างร่างด้วย Gemini"}
          </Button>
        </CardContent>
      </Card>

      {caption && (
        <Card>
          <CardHeader>
            <CardTitle>2. ตรวจและแก้ไข</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <label className="text-sm font-medium">แคปชัน</label>
              <Textarea value={caption} onChange={(e) => setCaption(e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">แฮชแท็ก (เว้นวรรค)</label>
              <Input value={hashtags} onChange={(e) => setHashtags(e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">ลิงก์ (ไม่บังคับ)</label>
              <Input value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="https://" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Alt text ของรูป</label>
              <Input value={altText} onChange={(e) => setAltText(e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">รูปภาพ (1 รูป)</label>
              <input type="file" accept="image/*" onChange={uploadImage} className="text-sm" />
              {mediaUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={mediaUrl} alt={altText} className="mt-2 max-h-48 rounded-md border" />
              )}
            </div>
            {warnings.length > 0 && (
              <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-200">
                <p className="font-medium">คำเตือนจาก Gemini:</p>
                <ul className="list-inside list-disc">
                  {warnings.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </div>
            )}
            {suggestedAt && (
              <p className="text-sm text-muted-foreground">
                เวลาที่แนะนำให้โพสต์: {suggestedAt}
              </p>
            )}
            <Button onClick={save} disabled={saving || !caption.trim()}>
              {saving ? "กำลังบันทึก..." : "บันทึกร่าง → ไปหน้าอนุมัติ"}
            </Button>
          </CardContent>
        </Card>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
