import { redirect } from "next/navigation";

export default function AppIndex() {
  // This page should never be seen; redirect to /app
  redirect("/app");
}
