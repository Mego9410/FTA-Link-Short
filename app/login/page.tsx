import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import LoginForm from "./LoginForm";

export const metadata = { title: "Sign in — FTA Link Shortener" };

export default async function LoginPage() {
  if (await isAuthenticated()) redirect("/");

  return (
    <main className="login-wrap">
      <div className="login-card">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="Frank Taylor & Associates" />
        <p className="eyebrow">Link shortener</p>
        <h2 className="h2" style={{ marginTop: 6, marginBottom: 8 }}>
          Sign in to continue
        </h2>
        <p className="small" style={{ color: "var(--fg-2)", marginBottom: 24 }}>
          Enter the team password to manage companies and short links.
        </p>
        <LoginForm />
      </div>
    </main>
  );
}
