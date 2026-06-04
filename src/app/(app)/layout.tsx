import Link from "next/link";
import { requireSession } from "@/lib/auth/session";
import { LogoutButton } from "@/components/logout-button";

const NAV = [
  { href: "/dashboard", label: "แดชบอร์ด" },
  { href: "/compose", label: "สร้างโพสต์" },
  { href: "/calendar", label: "ปฏิทิน" },
  { href: "/settings/facebook", label: "เชื่อมต่อ Facebook" },
];

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireSession();

  return (
    <div className="min-h-screen">
      <header className="border-b">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
          <nav className="flex flex-wrap items-center gap-1">
            <span className="mr-3 font-bold">FB · Gemini</span>
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-md px-3 py-1.5 text-sm hover:bg-muted"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-muted-foreground sm:inline">
              {session.email}
            </span>
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
    </div>
  );
}
