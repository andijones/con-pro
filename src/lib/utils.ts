import { createCn } from "cn/config";

/**
 * Class merging that knows the DS type scale. Without this, `text-micro`, `text-caption` and `text-reading` would be
 * read as text colours: next to `text-sm` both would survive, and next to `text-muted-foreground` the colour would be
 * dropped. See the type scale in globals.css (@theme inline).
 */
export const cn = createCn({
  extend: { classGroups: { "font-size": [{ text: ["micro", "caption", "reading"] }, "eyebrow", "figure-xl", "figure-lg", "figure-md", "figure-sm"] } },
});
