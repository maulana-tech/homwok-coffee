import { redirect } from "next/navigation";

// Land on the cashier screen; the dashboard layout's client-side auth guard
// bounces unauthenticated visitors to /login.
export default function RootPage() {
  redirect("/kasir");
}
