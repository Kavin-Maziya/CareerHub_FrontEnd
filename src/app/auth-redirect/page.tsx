import { auth } from "@/src/auth";
import { redirect } from "next/navigation";

export default async function AuthRedirectPage() {
  const session = await auth();

  if (!session?.user) redirect("/login");

  if (session.user.role === "employer") {
    redirect("/dashboard/listings");
  }

  redirect("/jobs");
}