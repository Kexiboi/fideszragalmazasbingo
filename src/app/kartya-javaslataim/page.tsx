import { redirect } from "next/navigation";

/** Régi URL — egy mező javaslatok: Javaslataim. */
export default function KartyaJavaslataimLegacyRedirect(): never {
  redirect("/javaslataim");
}
