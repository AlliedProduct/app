import { CampusWalletProvider } from "@/lib/WalletProvider";

export const metadata = {
  title: "CampusCoin",
  description: "Blockchain-powered campus payments and rewards on Solana",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, background: "#0f172a" }}>
        <CampusWalletProvider>{children}</CampusWalletProvider>
      </body>
    </html>
  );
}
