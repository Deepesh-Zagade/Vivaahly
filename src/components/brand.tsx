import Image from "next/image";
import Link from "next/link";

type BrandProps = {
  href?: string;
  inverse?: boolean;
  className?: string;
};

export function Brand({ href = "/", inverse = false, className = "" }: BrandProps) {
  return (
    <Link
      href={href}
      aria-label="Vivaahly home"
      className={`inline-flex items-center gap-2.5 no-underline ${className}`}
    >
      <Image
        src="/brand/vivaahly-mark.svg"
        alt=""
        width={36}
        height={36}
        className={inverse ? "brightness-0 invert" : ""}
        priority
      />
      <span
        className={`font-headline-lg text-[24px] font-semibold leading-none tracking-tight sm:text-[27px] ${
          inverse ? "text-inverse-on-surface" : "text-on-surface"
        }`}
      >
        Vivaahly
      </span>
    </Link>
  );
}
