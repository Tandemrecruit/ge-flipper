// Centralized item icon URL resolution.
// Prefer RuneLite's static cache by item id (stable and avoids wiki filename guessing).

export function getItemIconUrl(itemOrId, fallbackName) {
  const id = typeof itemOrId === 'object' ? itemOrId?.id : itemOrId;
  const icon = typeof itemOrId === 'object' ? itemOrId?.icon : null;
  const name = typeof itemOrId === 'object' ? itemOrId?.name : fallbackName;

  // If the icon field is already a fully-qualified URL, use it.
  if (typeof icon === 'string' && /^https?:\/\//i.test(icon)) return icon;

  // Most reliable path: RuneLite item icon by numeric id.
  if (id != null && id !== '' && !Number.isNaN(Number(id))) {
    return `https://static.runelite.net/cache/item/icon/${Number(id)}.png`;
  }

  // Fallback: best-effort OSRS Wiki filename guess.
  const key = (icon || name || '').trim().replace(/ /g, '_');
  if (!key) return '';
  return `https://oldschool.runescape.wiki/images/${encodeURIComponent(key)}.png`;
}
