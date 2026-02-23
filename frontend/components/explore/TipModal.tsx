"use client"

import { useState, useEffect } from "react";
import { X, Wallet, RefreshCw, Loader2, ExternalLink } from "lucide-react";
// Public mode: tipping disabled (no auth/wallet)
import { successToast, errorToast, loadingToast } from "@/lib/toast";
import { toast } from "sonner";
import { NetworkStatus } from "./NetworkStatus";

interface TipModalProps {
  isOpen: boolean;
  onClose: () => void;
  creatorAddress: string;
  creatorName: string;
  videoId: string;
}

const PRESET_AMOUNTS = [0.01, 0.05, 0.1, 0.5, 1, 5];
const PROVN_TOKEN_ADDRESS = "0xa673B3E946A64037AdBAe22a0f56916dE43c678c";
const EXPLORER_BASE_URL = "https://basecamp.cloud.blockscout.com";

export default function TipModal({
  isOpen,
  onClose,
  creatorAddress,
  creatorName,
  videoId,
}: TipModalProps) {
  const isAuthenticated = false;
  const walletAddress: string | null = null;
  const loading = false;
  const userBalance = "0";
  const balanceLoading = false;
  const balanceError = "";
  const refetchBalance = () => {};
  
  const [selectedAmount, setSelectedAmount] = useState(0.1);
  const [customAmount, setCustomAmount] = useState("");
  const [message, setMessage] = useState("");

  // Smart amount suggestions based on balance
  const getSuggestedAmounts = () => {
    const balance = parseFloat(userBalance);
    if (balance === 0) return PRESET_AMOUNTS;
    
    return PRESET_AMOUNTS.filter(amount => amount <= balance * 0.8);
  };


  const handleSendTip = async () => {
    errorToast.general("Tipping is disabled in this demo build.");
  };

  const handleFaucetRequest = async () => {
  errorToast.general("Faucet is disabled in this demo build.");
  };

  if (!isOpen) return null;

  const suggestedAmounts = getSuggestedAmounts();

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-provn-surface border border-provn-border rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-xs sm:max-w-sm mx-2 sm:mx-4 overflow-hidden">
        {/* Compact Header */}
        <div className="flex items-center justify-between p-3 sm:p-4 border-b border-provn-border">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-provn-text font-headline">
              Tip {creatorName}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-provn-surface-2 rounded-lg transition-colors touch-manipulation"
          >
            <X className="w-4 h-4 text-provn-muted hover:text-provn-text" />
          </button>
        </div>

        <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
          {/* Network status hidden in demo */}

          {/* Compact Balance */}
          <div className="flex items-center justify-between text-sm font-headline">
            <span className="text-provn-muted">Balance:</span>
            <div className="flex items-center gap-2">
              <span className="text-provn-accent font-bold">0 PROVN</span>
              <button
                onClick={refetchBalance}
                className="p-1 hover:bg-provn-surface-2 rounded transition-colors"
                disabled={balanceLoading}
              >
                <RefreshCw className={`w-3 h-3 text-provn-muted ${balanceLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Balance errors hidden in demo */}

          {/* Compact Faucet for New Users */}
          {true && (
            <div className="text-center">
              <button
                onClick={handleFaucetRequest}
                disabled={loading}
                className="text-xs text-provn-accent hover:text-provn-accent-press underline font-headline transition-colors"
              >
                {loading ? "Getting tokens..." : "Get 100 free PROVN tokens"}
              </button>
            </div>
          )}

          {/* Amount Input */}
          <div>
            <label className="block text-sm font-headline text-provn-text mb-2">
              Amount
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                min="0.01"
                max={"0"}
                value={customAmount || selectedAmount || ""}
                onChange={(e) => {
                  setCustomAmount(e.target.value);
                  setSelectedAmount(0);
                }}
                placeholder="0.00"
                className="w-full p-3 pr-16 border border-provn-border rounded-lg bg-provn-surface-2 text-provn-text placeholder-provn-muted focus:outline-none focus:ring-1 focus:ring-provn-accent focus:border-provn-accent transition-all font-headline"
              />
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-provn-muted font-headline">
                PROVN
              </span>
            </div>
            
            {/* Quick Amounts */}
            <div className="flex gap-1 sm:gap-1.5 mt-2">
              {suggestedAmounts.slice(0, 4).map((amount) => (
                <button
                  key={amount}
                  onClick={() => {
                    setSelectedAmount(amount);
                    setCustomAmount(amount.toString());
                  }}
                  disabled={true}
                  className="flex-1 py-2 px-1.5 text-xs rounded border border-provn-border hover:border-provn-accent hover:bg-provn-accent/5 text-provn-muted hover:text-provn-text transition-all font-headline disabled:opacity-50 touch-manipulation min-h-[32px] active:scale-95"
                >
                  {amount}
                </button>
              ))}
            </div>
            
            {false && (
              <p className="text-provn-error text-xs mt-1 font-headline">Insufficient balance</p>
            )}
          </div>

          {/* Message */}
          <div>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Add a message (optional)..."
              rows={2}
              maxLength={100}
              className="w-full p-2.5 text-sm border border-provn-border rounded-lg bg-provn-surface-2 text-provn-text placeholder-provn-muted focus:outline-none focus:ring-1 focus:ring-provn-accent focus:border-provn-accent transition-all resize-none font-headline"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-1 sm:pt-2">
            <button
              onClick={onClose}
              className="px-3 sm:px-4 py-2.5 text-sm text-provn-muted hover:text-provn-text transition-colors font-headline touch-manipulation"
            >
              Cancel
            </button>
            <button
              onClick={handleSendTip}
              disabled={true}
              className="flex-1 bg-provn-accent hover:bg-provn-accent-press disabled:bg-provn-muted disabled:cursor-not-allowed text-white font-medium py-2.5 px-4 rounded-lg transition-all font-headline touch-manipulation min-h-[40px] active:scale-[0.98]"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sending...
                </div>
              ) : (
                `Send (disabled)`
              )}
            </button>
          </div>

          {/* Compact Footer */}
          <div className="text-center pt-2 border-t border-provn-border">
            <p className="text-xs text-provn-muted font-headline">
              Sent directly to creator's wallet
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}