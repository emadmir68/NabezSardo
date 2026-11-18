import { redirect } from "next/navigation";
import { isD1, prodOrigin } from "@/lib/mode";

/* در حالت d1، ورود تحریریه به پنل اصلی سایت هدایت می‌شود */
export default function AdminLoginLayout({ children }: { children: React.ReactNode }) {
  if (isD1()) redirect(`${prodOrigin()}/admin/login`);
  return <>{children}</>;
}
