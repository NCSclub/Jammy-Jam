/**
 * Team name -> the piece of URL that stands for their game page.
 *
 * NFD then stripping the combining range is what turns "Équipe Café" into
 * "equipe-cafe" rather than "quipe-caf" — decomposing first separates the
 * accent from the letter, so only the accent is dropped.
 */
export function slugify(value: string) {
  const slug = value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    /* the slice can land mid-separator */
    .replace(/-+$/g, "");

  /* A name written entirely in a non-Latin script slugifies to nothing, and an
     empty slug would collide with the gallery route itself. */
  return slug || "team";
}
