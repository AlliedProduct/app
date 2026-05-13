/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useCallback } from "react";
import { PublicKey } from "@solana/web3.js";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useCampusCoin } from "@/hooks/useCampusCoin";
import { CAMPUSCOIN_MINT, PROGRAM_ID } from "@/lib/anchor";

// icons
const Icons = {
  Wallet: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" /><path d="M3 5v14a2 2 0 0 0 2 2h16v-5" /><path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
    </svg>
  ),
  Send: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" />
    </svg>
  ),
  Gift: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="8" width="18" height="4" rx="1" /><path d="M12 8v13" /><path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7" />
      <path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5" />
    </svg>
  ),
  Store: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7" /><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4" /><path d="M2 7h20" />
    </svg>
  ),
  Shield: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
    </svg>
  ),
  Chart: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3v16a2 2 0 0 0 2 2h16" /><path d="m19 9-5 5-4-4-3 3" />
    </svg>
  ),
  Check: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  ),
  Copy: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="14" height="14" x="8" y="8" rx="2" ry="2" /><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
    </svg>
  ),
  Refresh: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M3 21v-5h5"/>
    </svg>
  ),
  Coins: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="8" r="6" /><path d="M18.09 10.37A6 6 0 1 1 10.34 18" /><path d="M7 6h1v4" /><path d="m16.71 13.88.7.71-2.82 2.82" />
    </svg>
  ),
};

//  utilities 
const shortAddr = (addr: string) => addr.length > 10 ? `${addr.slice(0, 4)}...${addr.slice(-4)}` : addr;

// toast notis
function Toast({
  message,
  type,
  txId,
  onClose,
}: {
  message: string;
  type: string;
  txId?: string;
  onClose: () => void;
}) {
  useEffect(() => {
    const t = setTimeout(onClose, 8000);
    return () => clearTimeout(t);
  }, [onClose]);

  const bg =
    type === "success"
      ? "#0d9488"
      : type === "error"
      ? "#dc2626"
      : "#2563eb";

  return (
    <div
      style={{
        position: "fixed",
        bottom: 24,
        right: 24,
        zIndex: 9999,
        background: bg,
        color: "#fff",
        padding: "14px 24px",
        borderRadius: 12,
        fontSize: 14,
        fontWeight: 500,
        boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
        maxWidth: 400,
        wordBreak: "break-word",
      }}
    >
      {message}

      {txId && (
        <a
          href={`https://explorer.solana.com/tx/${txId}?cluster=devnet`}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: "#fff",
            fontSize: 12,
            display: "block",
            marginTop: 6,
            opacity: 0.85,
            textDecoration: "underline",
          }}
        >
          View on Solana Explorer →
        </a>
      )}
    </div>
  );
}
// main app
export default function CampusCoinApp() {
  const wallet = useWallet();
  const { connection } = useConnection();
  const cc = useCampusCoin();

  const [role, setRole] = useState<"student" | "merchant" | "admin">("student");
  const [activeTab, setActiveTab] = useState("wallet");
  const [balance, setBalance] = useState(0);
  const [solBalance, setSolBalance] = useState(0);
  const [toast, setToast] = useState<{ message: string; type: string; txId?: string } | null>(null);

  // form states
  const [payAmount, setPayAmount] = useState("");
  const [payMerchantKey, setPayMerchantKey] = useState("");
  const [rewardAmount, setRewardAmount] = useState("");
  const [rewardStudentKey, setRewardStudentKey] = useState("");
  const [newMerchantKey, setNewMerchantKey] = useState("");
  const [merchants, setMerchants] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const showToast = (message: string, type = "success", txId?: string) => setToast({ message, type, txId });

  // refresh bal
  const { getBalance } = cc;
  const refreshBalances = useCallback(async () => {
    if (!wallet.publicKey) return;
    try {
      const camp = await getBalance();
      setBalance(camp);
      const sol = await connection.getBalance(wallet.publicKey);
      setSolBalance(sol / 1e9);
    } catch (err) {
      console.error("Balance refresh failed:", err);
    }
  }, [wallet.publicKey, getBalance, connection]);

  // refresh merchants
  const refreshMerchants = useCallback(async () => {
    try {
      const all = await cc.getAllMerchants();
      setMerchants(all);
    } catch (err) {
      console.error("Merchant fetch failed:", err);
    }
  }, [cc]);

  // load + refresh on wallet change
  useEffect(() => {
    if (wallet.publicKey) {
      refreshBalances();
      refreshMerchants();
    }
  }, [wallet.publicKey]);

  // handlers on chain calls

const handlePayment = async () => {
    if (!payMerchantKey || !payAmount) return showToast("Fill in all fields", "error");
    let merchantPubkey: PublicKey;
    try {
      merchantPubkey = new PublicKey(payMerchantKey);
    } catch {
      return showToast("Invalid merchant public key", "error");
    }
    const amt = parseFloat(payAmount);
    if (isNaN(amt) || amt <= 0) return showToast("Invalid amount", "error");

    setLoading(true);
    try {
      const tx = await cc.payMerchant(merchantPubkey, amt);
      showToast(`Payment sent! Tx: ${shortAddr(tx)}`, "success", tx);
      setPayAmount("");
      setPayMerchantKey("");
      await refreshBalances();
    } catch (err: any) {
      console.error(err);
      showToast(err.message || "Payment failed", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleReward = async () => {
    if (!rewardStudentKey || !rewardAmount) return showToast("Fill in all fields", "error");
    let studentPubkey: PublicKey;
    try {
      studentPubkey = new PublicKey(rewardStudentKey);
    } catch {
      return showToast("Invalid student public key", "error");
    }
    const amt = parseFloat(rewardAmount);
    if (isNaN(amt) || amt <= 0) return showToast("Invalid amount", "error");

    setLoading(true);
    try {
      const tx = await cc.earnReward(studentPubkey, amt);
      showToast(`Reward minted! Tx: ${shortAddr(tx)}`, "success", tx);
      setRewardAmount("");
      setRewardStudentKey("");
      await refreshBalances();
    } catch (err: any) {
      console.error(err);
      showToast(err.message || "Reward minting failed", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterMerchant = async () => {
    if (!newMerchantKey) return showToast("Enter merchant public key", "error");
    let merchantPubkey: PublicKey;
    try {
      merchantPubkey = new PublicKey(newMerchantKey);
    } catch {
      return showToast("Invalid public key format", "error");
    }

    setLoading(true);
    try {
      const tx = await cc.registerMerchant(merchantPubkey);
      showToast(`Merchant registered! Tx: ${shortAddr(tx)}`, "success", tx);
      setNewMerchantKey("");
      await refreshMerchants();
    } catch (err: any) {
      console.error(err);
      showToast(err.message || "Registration failed", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleAirdrop = async () => {
    if (!wallet.publicKey) return;
    setLoading(true);
    try {
      const sig = await connection.requestAirdrop(wallet.publicKey, 2 * 1e9);
      await connection.confirmTransaction(sig, "confirmed");
      showToast("Airdropped 2 SOL");
      await refreshBalances();
    } catch (err: any) {
      showToast(err.message || "Airdrop failed", "error");
    } finally {
      setLoading(false);
    }
  };

  // tabs
  const tabs = role === "admin"
    ? [
        { id: "wallet", label: "Dashboard", icon: <Icons.Chart /> },
        { id: "merchants", label: "Merchants", icon: <Icons.Store /> },
        { id: "rewards", label: "Mint Rewards", icon: <Icons.Gift /> },
      ]
    : [
        { id: "wallet", label: "Wallet", icon: <Icons.Wallet /> },
        { id: "pay", label: "Pay Merchant", icon: <Icons.Send /> },
      ];

  // not connected screen
  if (!wallet.connected) {
    return (
      <>
        <GlobalStyles />
        <div style={{
          minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
          background: "linear-gradient(145deg, #0a0e1a 0%, #111827 50%, #0f172a 100%)",
          fontFamily: "'DM Sans', sans-serif",
        }}>
          <div style={{ textAlign: "center", maxWidth: 440, padding: "0 24px", animation: "fadeUp 0.8s ease" }}>
            <div style={{
              width: 88, height: 88, borderRadius: 24,
              background: "linear-gradient(135deg, #14b8a6, #0d9488)",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 32px", boxShadow: "0 12px 40px rgba(20,184,166,0.3)",
              color: "#fff",
            }}>
              <Icons.Coins />
            </div>
            <h1 style={{
              fontSize: 40, fontWeight: 700, color: "#f1f5f9", letterSpacing: "-0.02em",
              marginBottom: 8, fontFamily: "'Space Mono', monospace",
            }}>
              CampusCoin
            </h1>
            <p style={{ fontSize: 16, color: "#94a3b8", marginBottom: 36, lineHeight: 1.6 }}>
              Blockchain-powered campus payments &amp; rewards on Solana
            </p>

            <div style={{ display: "flex", justifyContent: "center" }}>
              <WalletMultiButton style={{
                background: "linear-gradient(135deg, #14b8a6, #0d9488)",
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: 600,
                borderRadius: 12,
                padding: "14px 28px",
                fontSize: 15,
              }} />
            </div>

            <div style={{
              marginTop: 32, display: "inline-flex", alignItems: "center", gap: 6,
              padding: "6px 14px", borderRadius: 20,
              background: "rgba(20,184,166,0.08)", border: "1px solid rgba(20,184,166,0.2)",
            }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#14b8a6", animation: "pulse 2s infinite" }} />
              <span style={{ fontSize: 12, color: "#14b8a6", fontWeight: 500 }}>
                Solana Localnet
              </span>
            </div>
          </div>
        </div>
      </>
    );
  }

  // main app
  return (
    <>
      <GlobalStyles />
      <div style={{ minHeight: "100vh", background: "var(--cc-bg)", fontFamily: "'DM Sans', sans-serif", color: "var(--cc-text)" }}>
        {/* HEADER */}
        <header style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 24px", borderBottom: "1px solid var(--cc-border)",
          background: "rgba(15, 23, 42, 0.8)", backdropFilter: "blur(12px)",
          position: "sticky", top: 0, zIndex: 100,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: "linear-gradient(135deg, #14b8a6, #0d9488)",
              display: "flex", alignItems: "center", justifyContent: "center", color: "#fff",
            }}>
              <Icons.Coins />
            </div>
            <span style={{ fontSize: 18, fontWeight: 700, fontFamily: "'Space Mono', monospace" }}>CampusCoin</span>
            <span style={{
              fontSize: 10, padding: "3px 8px", borderRadius: 6,
              background: role === "admin" ? "rgba(239,68,68,0.15)" : "rgba(20,184,166,0.15)",
              color: role === "admin" ? "#ef4444" : "#14b8a6",
              fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em",
            }}>
              {role}
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {/* Role switcher */}
            <select value={role} onChange={(e) => { setRole(e.target.value as any); setActiveTab("wallet"); }} style={{
              padding: "8px 12px", borderRadius: 8,
              background: "var(--cc-surface)", border: "1px solid var(--cc-border)",
              color: "var(--cc-text)", fontSize: 13, cursor: "pointer",
            }}>
              <option value="student">Student View</option>
              <option value="merchant">Merchant View</option>
              <option value="admin">Admin View</option>
            </select>
            <WalletMultiButton style={{
              background: "var(--cc-surface)", fontFamily: "'DM Sans', sans-serif",
              fontSize: 13, padding: "8px 14px", borderRadius: 8, height: "auto",
            }} />
          </div>
        </header>

        <div style={{ display: "flex", minHeight: "calc(100vh - 65px)" }}>
          {/* SIDEBAR */}
          <nav style={{
            width: 220, padding: "20px 12px", borderRight: "1px solid var(--cc-border)",
            display: "flex", flexDirection: "column", gap: 4, background: "rgba(30,41,59,0.3)",
          }}>
            {tabs.map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "12px 14px", borderRadius: 10, border: "none",
                background: activeTab === tab.id ? "var(--cc-accent-glow)" : "transparent",
                color: activeTab === tab.id ? "var(--cc-accent)" : "var(--cc-text-muted)",
                fontSize: 14, fontWeight: activeTab === tab.id ? 600 : 400,
                cursor: "pointer", textAlign: "left", width: "100%",
              }}>
                {tab.icon}{tab.label}
              </button>
            ))}

            <div style={{ flex: 1 }} />

            <div style={{ padding: "14px", borderRadius: 10, background: "var(--cc-surface)", fontSize: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#14b8a6", animation: "pulse 2s infinite" }} />
                <span style={{ color: "var(--cc-text-muted)" }}>Solana Localnet</span>
              </div>
              <div style={{ color: "var(--cc-text-muted)", marginBottom: 4 }}>
                Program: <span style={{ color: "var(--cc-text)", fontFamily: "'Space Mono', monospace", fontSize: 10 }}>
                  {shortAddr(PROGRAM_ID.toBase58())}
                </span>
              </div>
              <div style={{ color: "var(--cc-text-muted)" }}>
                Mint: <span style={{ color: "var(--cc-text)", fontFamily: "'Space Mono', monospace", fontSize: 10 }}>
                  {shortAddr(CAMPUSCOIN_MINT.toBase58())}
                </span>
              </div>
            </div>
          </nav>

          {/* MAIN CONTENT */}
          <main style={{ flex: 1, padding: "28px 32px", overflowY: "auto", maxHeight: "calc(100vh - 65px)" }}>
            
            {/* DASHBOARD/WALLET TAB */}
            {activeTab === "wallet" && (
              <div style={{ animation: "fadeUp 0.4s ease" }}>
                <div style={{
                  background: "linear-gradient(135deg, rgba(20,184,166,0.12) 0%, rgba(13,148,136,0.06) 100%)",
                  border: "1px solid rgba(20,184,166,0.2)",
                  borderRadius: 20, padding: "32px 36px", marginBottom: 28,
                  position: "relative", overflow: "hidden",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <p style={{ fontSize: 13, color: "var(--cc-text-muted)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 500 }}>
                        Your CampusCoin Balance
                      </p>
                      <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                        <span style={{ fontSize: 48, fontWeight: 700, fontFamily: "'Space Mono', monospace", color: "var(--cc-accent)", letterSpacing: "-0.03em" }}>
                          {balance.toFixed(2)}
                        </span>
                        <span style={{ fontSize: 20, color: "var(--cc-text-muted)", fontWeight: 500 }}>CAMP</span>
                      </div>
                      <div style={{ display: "flex", gap: 24, marginTop: 20 }}>
                        <div>
                          <span style={{ fontSize: 12, color: "var(--cc-text-muted)" }}>SOL Balance</span>
                          <p style={{ fontSize: 16, fontWeight: 600, fontFamily: "'Space Mono', monospace" }}>{solBalance.toFixed(4)} SOL</p>
                        </div>
                        {role === "admin" && (
                          <div>
                            <span style={{ fontSize: 12, color: "var(--cc-text-muted)" }}>Registered Merchants</span>
                            <p style={{ fontSize: 16, fontWeight: 600, fontFamily: "'Space Mono', monospace" }}>{merchants.length}</p>
                          </div>
                        )}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={refreshBalances} style={{
                        padding: "8px 14px", borderRadius: 8,
                        background: "var(--cc-surface)", border: "1px solid var(--cc-border)",
                        color: "var(--cc-text)", fontSize: 13, cursor: "pointer",
                        display: "flex", alignItems: "center", gap: 6,
                      }}>
                        <Icons.Refresh /> Refresh
                      </button>
                      {solBalance < 0.5 && (
                        <button onClick={handleAirdrop} disabled={loading} style={{
                          padding: "8px 14px", borderRadius: 8,
                          background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.3)",
                          color: "#f59e0b", fontSize: 13, cursor: "pointer", fontWeight: 500,
                        }}>
                          + Airdrop SOL
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div style={{ background: "var(--cc-surface)", border: "1px solid var(--cc-border)", borderRadius: 16, padding: "24px" }}>
                  <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Your Wallet Address</h3>
                  <div style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "14px 16px", borderRadius: 10, background: "var(--cc-bg)",
                    fontFamily: "'Space Mono', monospace", fontSize: 13,
                    color: "var(--cc-text-muted)", wordBreak: "break-all",
                  }}>
                    <span>{wallet.publicKey?.toBase58()}</span>
                    <button onClick={() => {
                      navigator.clipboard.writeText(wallet.publicKey!.toBase58());
                      showToast("Address copied");
                    }} style={{
                      background: "var(--cc-surface)", border: "1px solid var(--cc-border)",
                      color: "var(--cc-text-muted)", padding: 8, borderRadius: 6,
                      cursor: "pointer", display: "flex", marginLeft: 12,
                    }}>
                      <Icons.Copy />
                    </button>
                  </div>
                  <p style={{ fontSize: 12, color: "var(--cc-text-muted)", marginTop: 12 }}>
                    Share this address to receive CampusCoin from rewards or transfers.
                  </p>
                </div>

                {role === "admin" && merchants.length > 0 && (
                  <div style={{ background: "var(--cc-surface)", border: "1px solid var(--cc-border)", borderRadius: 16, padding: "24px", marginTop: 20 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Registered Merchants ({merchants.length})</h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {merchants.slice(0, 5).map((m, i) => (
                        <div key={i} style={{
                          display: "flex", justifyContent: "space-between", alignItems: "center",
                          padding: "10px 14px", background: "var(--cc-bg)", borderRadius: 8,
                          fontSize: 13, fontFamily: "'Space Mono', monospace",
                        }}>
                          <span style={{ color: "var(--cc-text-muted)" }}>{m.merchant}</span>
                          <span style={{ color: m.allowed ? "#10b981" : "#ef4444", fontWeight: 600 }}>
                            {m.allowed ? "ACTIVE" : "DISABLED"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* PAY MERCHANT TAB */}
            {activeTab === "pay" && (
              <div style={{ animation: "fadeUp 0.4s ease", maxWidth: 560 }}>
                <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Pay Merchant</h2>
                <p style={{ fontSize: 14, color: "var(--cc-text-muted)", marginBottom: 28 }}>
                  Send CampusCoin to a registered campus merchant
                </p>

                <div style={{ background: "var(--cc-surface)", border: "1px solid var(--cc-border)", borderRadius: 16, padding: "28px" }}>
                  <label style={{ display: "block", marginBottom: 18 }}>
                    <span style={{ fontSize: 13, fontWeight: 500, color: "var(--cc-text-muted)", display: "block", marginBottom: 6 }}>
                      Merchant Wallet Public Key
                    </span>
                    <input value={payMerchantKey} onChange={(e) => setPayMerchantKey(e.target.value)}
                      placeholder="e.g. 7xKXt..."
                      style={{
                        width: "100%", padding: "14px 16px", borderRadius: 10,
                        background: "var(--cc-bg)", border: "1.5px solid var(--cc-border)",
                        color: "var(--cc-text)", fontSize: 13, fontFamily: "'Space Mono', monospace",
                      }} />
                  </label>

                  <label style={{ display: "block", marginBottom: 24 }}>
                    <span style={{ fontSize: 13, fontWeight: 500, color: "var(--cc-text-muted)", display: "block", marginBottom: 6 }}>
                      Amount (CAMP)
                    </span>
                    <input type="number" value={payAmount} onChange={(e) => setPayAmount(e.target.value)}
                      placeholder="0.00" min="0" step="0.01"
                      style={{
                        width: "100%", padding: "14px 16px", borderRadius: 10,
                        background: "var(--cc-bg)", border: "1.5px solid var(--cc-border)",
                        color: "var(--cc-text)", fontSize: 18, fontFamily: "'Space Mono', monospace",
                      }} />
                  </label>

                  <div style={{
                    display: "flex", justifyContent: "space-between",
                    padding: "12px 16px", borderRadius: 8,
                    background: "rgba(20,184,166,0.06)", marginBottom: 20, fontSize: 13,
                  }}>
                    <span style={{ color: "var(--cc-text-muted)" }}>Available Balance</span>
                    <span style={{ color: "var(--cc-accent)", fontWeight: 600, fontFamily: "'Space Mono', monospace" }}>
                      {balance.toFixed(2)} CAMP
                    </span>
                  </div>

                  <button onClick={handlePayment} disabled={loading} style={{
                    width: "100%", padding: "16px", borderRadius: 12,
                    background: loading ? "var(--cc-surface-hover)" : "linear-gradient(135deg, #14b8a6, #0d9488)",
                    border: "none", color: "#fff", fontSize: 16, fontWeight: 600,
                    cursor: loading ? "wait" : "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  }}>
                    {loading ? "Sending..." : <><Icons.Send /> Send Payment</>}
                  </button>
                </div>

                <div style={{
                  display: "flex", alignItems: "flex-start", gap: 10, marginTop: 16,
                  padding: "14px 16px", borderRadius: 10,
                  background: "rgba(20,184,166,0.04)", border: "1px solid rgba(20,184,166,0.1)",
                  fontSize: 12, color: "var(--cc-text-muted)",
                }}>
                  <Icons.Shield />
                  <span>The merchant must be registered by an admin first. The transaction will fail with MerchantNotAllowed otherwise.</span>
                </div>
              </div>
            )}

            {/* MERCHANTS TAB (Admin) */}
            {activeTab === "merchants" && (
              <div style={{ animation: "fadeUp 0.4s ease" }}>
                <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Merchant Registry</h2>
                <p style={{ fontSize: 14, color: "var(--cc-text-muted)", marginBottom: 28 }}>
                  Register new campus merchants to accept CampusCoin
                </p>

                <div style={{ background: "var(--cc-surface)", border: "1px solid var(--cc-border)", borderRadius: 16, padding: "24px", marginBottom: 24 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Register New Merchant</h3>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 12 }}>
                    <input value={newMerchantKey} onChange={(e) => setNewMerchantKey(e.target.value)}
                      placeholder="Merchant wallet public key"
                      style={{
                        padding: "12px 16px", borderRadius: 10,
                        background: "var(--cc-bg)", border: "1.5px solid var(--cc-border)",
                        color: "var(--cc-text)", fontSize: 13, fontFamily: "'Space Mono', monospace",
                      }} />
                    <button onClick={handleRegisterMerchant} disabled={loading} style={{
                      padding: "12px 24px", borderRadius: 10,
                      background: "linear-gradient(135deg, #14b8a6, #0d9488)",
                      border: "none", color: "#fff", fontSize: 14, fontWeight: 600,
                      cursor: loading ? "wait" : "pointer", whiteSpace: "nowrap",
                    }}>
                      {loading ? "Registering..." : "Register"}
                    </button>
                  </div>
                </div>

                <div style={{ background: "var(--cc-surface)", border: "1px solid var(--cc-border)", borderRadius: 16, overflow: "hidden" }}>
                  <div style={{
                    display: "grid", gridTemplateColumns: "2fr 1fr",
                    padding: "14px 20px", borderBottom: "1px solid var(--cc-border)",
                    fontSize: 12, fontWeight: 600, color: "var(--cc-text-muted)",
                    textTransform: "uppercase", letterSpacing: "0.05em",
                  }}>
                    <span>Merchant Pubkey</span><span>Status</span>
                  </div>
                  {merchants.length === 0 ? (
                    <div style={{ padding: "32px", textAlign: "center", color: "var(--cc-text-muted)", fontSize: 14 }}>
                      No merchants registered yet
                    </div>
                  ) : (
                    merchants.map((m, i) => (
                      <div key={i} style={{
                        display: "grid", gridTemplateColumns: "2fr 1fr",
                        padding: "16px 20px", borderBottom: "1px solid var(--cc-border)",
                        alignItems: "center", fontSize: 13,
                      }}>
                        <span style={{ fontFamily: "'Space Mono', monospace", color: "var(--cc-text-muted)" }}>
                          {m.merchant}
                        </span>
                        <span style={{
                          display: "inline-flex", padding: "4px 10px", borderRadius: 6, fontSize: 12, fontWeight: 500,
                          background: m.allowed ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.12)",
                          color: m.allowed ? "#10b981" : "#ef4444", width: "fit-content",
                        }}>
                          {m.allowed ? "Active" : "Disabled"}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* REWARDS TAB (Admin) */}
            {activeTab === "rewards" && (
              <div style={{ animation: "fadeUp 0.4s ease", maxWidth: 560 }}>
                <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Mint Rewards</h2>
                <p style={{ fontSize: 14, color: "var(--cc-text-muted)", marginBottom: 28 }}>
                  Issue CampusCoin to students for academic achievement
                </p>

                <div style={{ background: "var(--cc-surface)", border: "1px solid var(--cc-border)", borderRadius: 16, padding: "28px" }}>
                  <label style={{ display: "block", marginBottom: 18 }}>
                    <span style={{ fontSize: 13, fontWeight: 500, color: "var(--cc-text-muted)", display: "block", marginBottom: 6 }}>
                      Student Wallet Public Key
                    </span>
                    <input value={rewardStudentKey} onChange={(e) => setRewardStudentKey(e.target.value)}
                      placeholder="Student's wallet address"
                      style={{
                        width: "100%", padding: "14px 16px", borderRadius: 10,
                        background: "var(--cc-bg)", border: "1.5px solid var(--cc-border)",
                        color: "var(--cc-text)", fontSize: 13, fontFamily: "'Space Mono', monospace",
                      }} />
                  </label>

                  <label style={{ display: "block", marginBottom: 24 }}>
                    <span style={{ fontSize: 13, fontWeight: 500, color: "var(--cc-text-muted)", display: "block", marginBottom: 6 }}>
                      Reward Amount (CAMP)
                    </span>
                    <input type="number" value={rewardAmount} onChange={(e) => setRewardAmount(e.target.value)}
                      placeholder="0.00" min="0" step="0.01"
                      style={{
                        width: "100%", padding: "14px 16px", borderRadius: 10,
                        background: "var(--cc-bg)", border: "1.5px solid var(--cc-border)",
                        color: "var(--cc-text)", fontSize: 18, fontFamily: "'Space Mono', monospace",
                      }} />
                    <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                      {[10, 25, 50, 100].map((v) => (
                        <button key={v} onClick={() => setRewardAmount(v.toString())} style={{
                          padding: "6px 14px", borderRadius: 6,
                          background: "var(--cc-bg)", border: "1px solid var(--cc-border)",
                          color: "var(--cc-text-muted)", fontSize: 12, cursor: "pointer",
                        }}>
                          {v} CAMP
                        </button>
                      ))}
                    </div>
                  </label>

                  <button onClick={handleReward} disabled={loading} style={{
                    width: "100%", padding: "16px", borderRadius: 12,
                    background: loading ? "var(--cc-surface-hover)" : "linear-gradient(135deg, #8b5cf6, #7c3aed)",
                    border: "none", color: "#fff", fontSize: 16, fontWeight: 600,
                    cursor: loading ? "wait" : "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  }}>
                    {loading ? "Minting..." : <><Icons.Gift /> Mint Reward</>}
                  </button>
                </div>

                <div style={{
                  display: "flex", alignItems: "flex-start", gap: 10, marginTop: 16,
                  padding: "14px 16px", borderRadius: 10,
                  background: "rgba(139,92,246,0.04)", border: "1px solid rgba(139,92,246,0.1)",
                  fontSize: 12, color: "var(--cc-text-muted)",
                }}>
                  <Icons.Shield />
                  <span>Only the admin (mint authority) can mint rewards. The students token account will be created automatically if it doesnt exist yet.</span>
                </div>
              </div>
            )}
          </main>
        </div>

        {loading && (
          <div style={{
            position: "fixed", inset: 0, background: "rgba(15,23,42,0.5)",
            backdropFilter: "blur(4px)", display: "flex", alignItems: "center",
            justifyContent: "center", zIndex: 200,
          }}>
            <div style={{
              background: "var(--cc-surface)", borderRadius: 16, padding: "32px 40px",
              textAlign: "center", border: "1px solid var(--cc-border)",
            }}>
              <div style={{
                width: 40, height: 40, border: "3px solid var(--cc-border)",
                borderTopColor: "var(--cc-accent)", borderRadius: "50%",
                animation: "spin 0.8s linear infinite", margin: "0 auto 16px",
              }} />
              <p style={{ fontSize: 14, color: "var(--cc-text-muted)" }}>Processing transaction...</p>
              <p style={{ fontSize: 12, color: "var(--cc-text-muted)", marginTop: 4, opacity: 0.7 }}>
                Please approve in your wallet
              </p>
            </div>
          </div>
        )}

        {toast && <Toast message={toast.message} type={toast.type} txId={toast.txId} onClose={() => setToast(null)} />}
      </div>
    </>
  );
}

// styling
function GlobalStyles() {
  return (
    <style jsx global>{`
      @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Space+Mono:wght@400;700&display=swap');
      @keyframes fadeUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      @keyframes pulse { 0%, 100% { opacity: 0.6; } 50% { opacity: 1; } }
      @keyframes spin { to { transform: rotate(360deg); } }
      :root {
        --cc-bg: #0f172a;
        --cc-surface: #1e293b;
        --cc-surface-hover: #334155;
        --cc-border: #334155;
        --cc-text: #f1f5f9;
        --cc-text-muted: #94a3b8;
        --cc-accent: #14b8a6;
        --cc-accent-glow: rgba(20, 184, 166, 0.15);
      }
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { background: var(--cc-bg); }
      input:focus, select:focus { outline: none; border-color: var(--cc-accent) !important; box-shadow: 0 0 0 3px var(--cc-accent-glow) !important; }
      ::-webkit-scrollbar { width: 6px; }
      ::-webkit-scrollbar-thumb { background: var(--cc-border); border-radius: 3px; }
    `}</style>
  );
}
