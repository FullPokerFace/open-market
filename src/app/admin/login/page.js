import { Suspense } from "react";
import { AdminLoginForm } from "@/components/admin/login-form";
import { AdminPage, Message, PageTitle, SectionBar } from "@/components/admin/parts";
import { adminConfigured, safeNext } from "@/lib/admin";

export const metadata = { title: "Admin sign in", robots: { index: false } };

export default function AdminLoginPage({ searchParams }) {
  return (
    <AdminPage>
      <SectionBar index="00" name="Admin" />
      <header className="border-b px-6 pt-8 pb-6">
        <PageTitle before="Admin" accent="sign-in" />
      </header>
      <Suspense fallback={<Message>Loading…</Message>}>
        <Form searchParams={searchParams} />
      </Suspense>
    </AdminPage>
  );
}

async function Form({ searchParams }) {
  const next = safeNext((await searchParams).next);
  if (!adminConfigured()) {
    return <Message>Admin isn&apos;t set up yet. Add ADMIN_PASSWORD to .env.local and restart the server.</Message>;
  }
  return <AdminLoginForm next={next.startsWith("/admin") ? next : "/admin"} />;
}
