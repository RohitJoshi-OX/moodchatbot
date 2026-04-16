import { Outfit, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const mainFont = Outfit({
  variable: "--font-main",
  subsets: ["latin"],
});

export const metadata = {
  title: "Mood Portal — AI Chatbot",
  description: "An AI chatbot that shifts the entire UI based on the mood of the conversation. Built with Next.js and Groq.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${mainFont.variable}`} suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
