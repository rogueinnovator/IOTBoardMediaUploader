import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { DeviceProvider } from "@/context/DeviceContext";
import { AuthProvider } from "@/context/AuthContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Android TV App",
  description: "Next.js app for Android TV with Firebase integration",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <DeviceProvider>
            {children}
          </DeviceProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
