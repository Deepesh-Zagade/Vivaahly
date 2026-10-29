export function coupleDisplayName(groomName: string, brideName: string) {
  return [groomName.trim(), brideName.trim()].filter(Boolean).join(" & ");
}

function normalizedDisplayText(value: string) {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase("en");
}

export function titleMatchesCoupleNames(
  title: string,
  groomName: string,
  brideName: string,
) {
  return (
    normalizedDisplayText(title) ===
    normalizedDisplayText(coupleDisplayName(groomName, brideName))
  );
}
