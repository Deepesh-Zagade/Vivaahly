import { EB_Garamond, Plus_Jakarta_Sans } from "next/font/google";

const editorial = EB_Garamond({
  subsets: ["latin"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-editorial",
});
const interfaceFont = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-interface",
});

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`${editorial.variable} ${interfaceFont.variable}`}>
      {children}
    </div>
  );
}
