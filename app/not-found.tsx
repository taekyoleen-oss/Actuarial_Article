import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-4 text-center">
      <p className="font-mono text-xs uppercase tracking-widest text-[color:var(--color-muted-foreground)]">
        404 — not found
      </p>
      <h1 className="mt-3 font-serif text-3xl">자료를 찾을 수 없습니다</h1>
      <p className="mt-2 text-sm text-[color:var(--color-muted-foreground)]">
        주소가 변경되었거나, 자료가 archived 처리되었을 수 있습니다.
      </p>
      <Link
        href="/library"
        className="mt-6 inline-flex rounded-md bg-[color:var(--color-primary)] px-4 py-2 text-sm font-semibold text-[color:var(--color-primary-foreground)]"
      >
        라이브러리로 이동
      </Link>
    </div>
  );
}
