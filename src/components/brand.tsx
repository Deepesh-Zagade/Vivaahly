import Image from "next/image";
import Link from "next/link";

type BrandProps = {
  href?: string | null;
  inverse?: boolean;
  className?: string;
  showWordmark?: boolean;
};

export function Brand({
  href = "/",
  inverse = false,
  className = "",
  showWordmark = true,
}: BrandProps) {
  const content = (
    <>
      <Image
        src="/brand/vivaahly-mark.svg"
        alt=""
        width={36}
        height={36}
        className={inverse ? "brightness-0 invert" : ""}
        priority
      />
      {showWordmark ? (
        <span
          className={`font-headline-lg text-[24px] font-semibold leading-none tracking-tight sm:text-[27px] ${
            inverse ? "text-inverse-on-surface" : "text-primary"
          }`}
        >
          Vivaahly
        </span>
      ) : null}
    </>
  );

  if (!href) {
    return (
      <span
        aria-label="Vivaahly"
        className={`inline-flex items-center gap-2.5 ${className}`}
      >
        {content}
      </span>
    );
  }

  return (
    <Link
      href={href}
      aria-label="Vivaahly home"
      className={`inline-flex items-center gap-2.5 no-underline ${className}`}
    >
      {content}
    </Link>
  );
}
