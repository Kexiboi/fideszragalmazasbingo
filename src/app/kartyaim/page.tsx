import { redirect } from "next/navigation";

/** Régi URL — könyvjelzők miatt megmarad. */
export default function KartyaimLegacyRedirect(): never {
  redirect("/kiosztasaim");
}
