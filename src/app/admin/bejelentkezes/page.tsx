import { redirect } from "next/navigation";

export default function AdminBejelentkezesRedirect(): never {
  redirect("/bejelentkezes?callbackUrl=/admin");
}
