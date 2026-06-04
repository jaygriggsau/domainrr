import { DomainSearch } from "@/components/DomainSearch";
import { getSession } from "@/lib/auth";

export default async function Home() {
  const session = await getSession();

  return (
    <div className="flex flex-1 flex-col items-center px-6 pt-24 pb-16">
      <div className="w-full max-w-2xl text-center">
        <span className="inline-block rounded-full border border-border px-3 py-1 text-xs font-medium text-muted">
          Domains, made simple
        </span>
        <h1 className="mt-6 text-balance text-5xl font-semibold tracking-tight sm:text-6xl">
          Build your next dream.
        </h1>
        <p className="mx-auto mt-4 max-w-md text-balance text-lg text-muted">
          Find the perfect domain for your idea. Start typing — we&apos;ll check
          availability as you go.
        </p>

        <div className="mt-10 text-left">
          <DomainSearch signedIn={Boolean(session)} />
        </div>
      </div>
    </div>
  );
}
