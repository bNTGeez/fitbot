import { checkUser } from "@/lib/checkUser";
import { redirect } from "next/navigation";

export default async function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await checkUser();

  if (!user) {
    redirect("/api/auth/login");
  }

  return <>{children}</>;
}
