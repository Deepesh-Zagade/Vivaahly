export type PaginationItem = number | "ellipsis-left" | "ellipsis-right";

export function paginationItems(page: number, pageCount: number): PaginationItem[] {
  if (pageCount <= 7) {
    return Array.from({ length: pageCount }, (_, index) => index + 1);
  }

  const visible = new Set([1, pageCount, page - 1, page, page + 1]);
  if (page <= 3) {
    visible.add(2);
    visible.add(3);
  }
  if (page >= pageCount - 2) {
    visible.add(pageCount - 1);
    visible.add(pageCount - 2);
  }
  const pages = [...visible]
    .filter((candidate) => candidate >= 1 && candidate <= pageCount)
    .sort((left, right) => left - right);
  const items: PaginationItem[] = [];
  for (const candidate of pages) {
    const previous = items.at(-1);
    if (typeof previous === "number" && candidate - previous > 1) {
      items.push(previous === 1 ? "ellipsis-left" : "ellipsis-right");
    }
    items.push(candidate);
  }
  return items;
}
