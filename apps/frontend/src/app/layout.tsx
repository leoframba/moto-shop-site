import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";

const inter = Inter({ subsets: ["latin"] });

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: "Advanced Cycle Service",
	description: "The Bay Area's Premier Motorcycle Shop",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html
			lang="en"
			className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
		>
			<body className={`${inter.className} min-h-screen flex flex-col`}>
				<Navbar />

				<div className="flex-grow">
					{children}
					<Toaster theme="dark" richColors position="top-right" />
				</div>

				<Footer />
			</body>
		</html>
	);
}
