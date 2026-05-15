import type { Metadata } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { Providers } from "@/components/providers";

const manrope = Manrope({
	subsets: ["latin"],
	variable: "--font-manrope",
});

const cormorant = Cormorant_Garamond({
	subsets: ["latin"],
	weight: ["300", "400", "500", "600", "700"],
	style: ["normal", "italic"],
	variable: "--font-cormorant",
});

export const metadata: Metadata = {
	title: "Mahjong Royale",
	description: "Mahjong Parlor POS System",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" className={`${manrope.variable} ${cormorant.variable}`}>
			<body
				className="bg-[#0a120e] text-[#fef9ec] antialiased min-h-screen"
				suppressHydrationWarning
			>
				<Providers>{children}</Providers>
				<Toaster
					position="top-right"
					toastOptions={{
						style: {
							background: "rgba(20,36,28,0.95)",
							border: "1px solid rgba(251,191,36,0.25)",
							color: "#fef9ec",
						},
					}}
				/>
			</body>
		</html>
	);
}
