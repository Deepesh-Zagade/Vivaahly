import { Brand as SharedBrand } from "@/components/brand";

export function Brand({ inverse = false }: { inverse?: boolean }) {
  return <SharedBrand href="#top" inverse={inverse} />;
}
