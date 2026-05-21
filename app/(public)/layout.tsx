import { Header } from "@/components/shared/Header";
import { Footer } from "@/components/shared/Footer";

export default function PublicLayout({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto w-full max-w-[1280px] flex-1 px-4 py-8 md:px-6">{children}</main>
      <Footer />
    </div>
  );
}
