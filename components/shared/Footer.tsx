import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-[color:var(--color-border)]">
      <div className="mx-auto grid max-w-[1280px] gap-6 px-4 py-10 md:grid-cols-3 md:px-6">
        <div>
          <p className="font-serif text-base font-semibold">Actuarial Intel Korea</p>
          <p className="mt-2 text-sm text-[color:var(--color-muted-foreground)]">
            해외·국내 보험·계리 자료를 한국 실무 도입 관점에서 큐레이션하는 플랫폼.
          </p>
        </div>
        <div className="text-sm">
          <p className="mb-2 font-semibold">정책</p>
          <ul className="space-y-1 text-[color:var(--color-muted-foreground)]">
            <li>
              <Link href="/about" className="hover:text-[color:var(--color-foreground)]">
                플랫폼 소개·콘텐츠 수집 정책
              </Link>
            </li>
            <li>
              <Link href="/glossary" className="hover:text-[color:var(--color-foreground)]">
                용어 사전
              </Link>
            </li>
          </ul>
        </div>
        <div className="text-sm">
          <p className="mb-2 font-semibold">자료 제안</p>
          <p className="text-[color:var(--color-muted-foreground)]">
            관리자에게 직접 보내주세요: <br />
            <a
              href={`mailto:${process.env.SUBMISSION_CONTACT_EMAIL ?? "submit@actuarial-intel.kr"}`}
              className="text-[color:var(--color-primary)] hover:underline"
            >
              {process.env.SUBMISSION_CONTACT_EMAIL ?? "submit@actuarial-intel.kr"}
            </a>
          </p>
        </div>
      </div>
      <div className="border-t border-[color:var(--color-border)] py-4 text-center text-xs text-[color:var(--color-muted-foreground)]">
        © {new Date().getFullYear()} Actuarial Intel Korea. 정보 제공 목적, 실제 적용은 소속 회사·감독원 해석을 따릅니다.
      </div>
    </footer>
  );
}
