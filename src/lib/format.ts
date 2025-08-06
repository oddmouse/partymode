export function formatNumberDecimalNone(num: number) {
  if (!num) return "";

  return new Intl.NumberFormat(undefined, {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(num);
}

export function imageURL(url: string) {
  if (!url || !url.startsWith("image://")) return "";
  return `${location.origin}/image/${encodeURIComponent(url)}`;
}

export function joinWithAmpersand(array: string[] = []) {
  return array
    .sort()
    .join(", ")
    .replace(/,([^,]*)$/, " & $1");
}
