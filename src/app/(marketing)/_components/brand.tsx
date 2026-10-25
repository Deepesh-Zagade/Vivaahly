import Image from "next/image";

export function Brand({ inverse = false }: { inverse?: boolean }) {
  return (
    <a
      href="#top"
      aria-label="Vivaahly home"
      className="inline-flex items-center gap-2.5 no-underline"
    >
      <Image
        src="/brand/vivaahly-mark.svg"
        alt=""
        width={34}
        height={34}
        className={inverse ? "brightness-0 invert" : ""}
      />
      <span className="font-headline-lg text-[24px] font-semibold tracking-tight sm:text-[29px]">
        Vivaahly
      </span>
    </a>
  );
}
