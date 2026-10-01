export const gallerySections = [
  "Buttons",
  "Badges",
  "Cards",
  "Forms",
  "Selection",
  "Overlays",
  "Menus and commands",
  "Navigation",
  "Feedback",
  "Data display",
  "Contravo composites",
] as const;

export function slug(s: string) {
  return s.toLowerCase().replace(/[^a-z]+/g, "-");
}
