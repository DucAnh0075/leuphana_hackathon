import type { Metadata } from "next";
import Login from "@/components/vorsorge/Login";

export const metadata: Metadata = { title: "Log in | Vorsorge", description: "Access your existing care documents and sharing receipts." };
export default async function LoginPage({ searchParams }: { searchParams: Promise<Record<string,string|string[]|undefined>> }) {
  const params = await searchParams;
  return <Login next={typeof params.next === "string" ? params.next : undefined}/>;
}
