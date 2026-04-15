import { redirect } from "next/navigation";

/** A teljes 5×5 beküldés nincs a játékban; a régi URL átirányít. */
export default function KartyaJavaslatLegacyRedirect(): never {
  redirect("/jatek");
}
