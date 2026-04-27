import Link from 'next/link';
import { SUPPORT_EMAIL, SUPPORT_MAILTO } from '@/lib/constants';
import SiteFooter from '@/app/components/SiteFooter';

export default function DeleteAccountPage() {
  return (
    <div className="relative min-h-screen bg-[var(--bg)] text-[var(--text)] antialiased">
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255, 107, 53, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 107, 53, 0.03) 1px, transparent 1px)
          `,
          backgroundSize: '80px 80px',
        }}
        aria-hidden
      />

      <nav className="relative z-[100] flex h-16 items-center justify-between border-b border-[var(--border)] px-8 max-sm:px-5">
        <Link href="/" className="flex items-center gap-3 no-underline text-[var(--text)]">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--orange)] font-mono text-[10px] font-bold text-white">
            605B
          </div>
          <span className="text-base font-semibold">605b.ai</span>
        </Link>
        <div className="flex gap-6">
          <Link
            href="/privacy"
            className="text-sm text-[var(--text-secondary)] no-underline transition-colors hover:text-[var(--text)]"
          >
            Privacy
          </Link>
          <Link
            href="/terms"
            className="text-sm text-[var(--text-secondary)] no-underline transition-colors hover:text-[var(--text)]"
          >
            Terms
          </Link>
          <Link
            href="/sign-in"
            className="text-sm text-[var(--text-secondary)] no-underline transition-colors hover:text-[var(--text)]"
          >
            Sign In
          </Link>
        </div>
      </nav>

      <main className="relative z-10 mx-auto max-w-3xl px-8 py-16 pb-24 max-sm:px-5">
        <header className="mb-10 border-b border-[var(--border)] pb-8">
          <h1 className="mb-2 text-3xl font-bold tracking-tight sm:text-4xl">Delete Your Account</h1>
          <p className="text-sm text-[var(--text-muted)]">
            605B.ai (CreditClear) — account and data deletion information
          </p>
        </header>

        <div className="space-y-10 text-[15px] leading-relaxed text-[var(--text-secondary)]">
          <p className="text-[var(--text)]">
            If you would like to delete your 605B.ai account and associated data, you can request deletion
            at any time.
          </p>

          <section>
            <h2 className="mb-4 text-xl font-semibold text-[var(--text)]">How to request deletion</h2>
            <ol className="list-decimal space-y-3 pl-5 marker:text-[var(--orange)]">
              <li>
                Send an email to{' '}
                <a
                  href={SUPPORT_MAILTO}
                  className="font-medium text-[var(--orange)] no-underline hover:underline"
                >
                  {SUPPORT_EMAIL}
                </a>{' '}
                from the email associated with your account
              </li>
              <li>
                Include the subject line:{' '}
                <span className="rounded-md bg-[var(--bg-secondary)] px-2 py-0.5 font-mono text-sm text-[var(--text)]">
                  Account Deletion Request
                </span>
              </li>
              <li>We will process your request within a reasonable timeframe</li>
            </ol>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-semibold text-[var(--text)]">
              What happens when your account is deleted
            </h2>
            <ul className="list-disc space-y-2 pl-5 marker:text-[var(--orange)]">
              <li>Your account and associated personal data will be permanently deleted</li>
              <li>Any uploaded reports or analysis results will be removed from our systems</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-semibold text-[var(--text)]">Data retention</h2>
            <ul className="list-disc space-y-2 pl-5 marker:text-[var(--orange)]">
              <li>
                We may retain limited data where required for legal, security, or fraud-prevention purposes
              </li>
              <li>
                Retained data is minimized and handled in accordance with our{' '}
                <Link href="/privacy" className="font-medium text-[var(--orange)] no-underline hover:underline">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </section>

          <section className="rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] p-6">
            <h2 className="mb-3 text-xl font-semibold text-[var(--text)]">Contact</h2>
            <p className="mb-0">
              If you have any questions, contact{' '}
              <a
                href={SUPPORT_MAILTO}
                className="font-medium text-[var(--orange)] no-underline hover:underline"
              >
                {SUPPORT_EMAIL}
              </a>
              .
            </p>
          </section>
        </div>
      </main>

      <SiteFooter variant="minimal" />
    </div>
  );
}
