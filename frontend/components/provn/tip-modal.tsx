"use client";

import React, { useState } from "react";
import { ProvnButton } from "./button";
import { ProvnCard, ProvnCardContent } from "./card";
import { toast } from "sonner";

interface TipModalProps {
  isOpen: boolean;
  onClose: () => void;
  contentId: string;
  contentTitle: string;
  creatorHandle: string;
  creatorAddress: string;
  walletAddress?: string;
}

const TIP_AMOUNTS = [0.1, 0.5, 1, 5, 10, 25];

export function TipModal({
  isOpen,
  onClose,
  contentId,
  contentTitle,
  creatorHandle,
  creatorAddress,
  walletAddress
}: TipModalProps) {
  const [amount, setAmount] = useState<number>(1);
  const [customAmount, setCustomAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleTip = async () => {
    if (!walletAddress) {
      toast.error('Please connect your wallet to send tips');
      return;
    }

    const finalAmount = customAmount ? parseFloat(customAmount) : amount;
    
    if (finalAmount <= 0 || isNaN(finalAmount)) {
      toast.error('Please enter a valid tip amount');
      return;
    }

    if (finalAmount > 1000) {
      toast.error('Tip amount cannot exceed 1000 CAMP');
      return;
    }

    setIsLoading(true);

    try {
      // In a real implementation, this would involve blockchain transactions
      // For now, we'll simulate the tip and record it in the database
      
      // TODO: Implement actual CAMP token transfer transaction here
      const mockTransactionHash = `0x${Math.random().toString(16).substr(2, 64)}`;

      const response = await fetch('/api/social/tips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromWalletAddress: walletAddress,
          contentId,
          amount: finalAmount,
          currency: 'CAMP',
          transactionHash: mockTransactionHash,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success(
          <div>
            <div className="font-semibold">Tip sent successfully! 🎉</div>
            <div className="text-sm text-provn-muted mt-1">
              {finalAmount} CAMP sent to {creatorHandle}
            </div>
          </div>,
          { duration: 5000 }
        );
        onClose();
        
        // Reset form
        setAmount(1);
        setCustomAmount('');
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Failed to send tip:', error);
      toast.error('Failed to send tip. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCustomAmountChange = (value: string) => {
    // Only allow numbers and decimal point
    if (/^\d*\.?\d*$/.test(value)) {
      setCustomAmount(value);
      setAmount(0); // Clear preset amount when custom is used
    }
  };

  const selectPresetAmount = (presetAmount: number) => {
    setAmount(presetAmount);
    setCustomAmount(''); // Clear custom amount when preset is selected
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      {/* Modal */}
      <div className="relative w-full max-w-md mx-4 bg-provn-surface rounded-2xl border border-provn-border overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-provn-border">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 text-orange-500">⚡</span>
            <h2 className="text-xl font-bold text-provn-text">Send Tip</h2>
          </div>
          <ProvnButton
            variant="secondary"
            size="sm"
            onClick={onClose}
            className="w-8 h-8 p-0"
          >
            <span className="w-5 h-5">✕</span>
          </ProvnButton>
        </div>
        
        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Content Info */}
          <div className="text-center space-y-2">
            <div className="text-provn-text font-medium line-clamp-1">
              "{contentTitle}"
            </div>
            <div className="text-sm text-provn-muted">
              by {creatorHandle}
            </div>
            <div className="text-xs text-provn-muted font-mono">
              {creatorAddress.slice(0, 6)}...{creatorAddress.slice(-4)}
            </div>
          </div>

          {/* Amount Selection */}
          <div className="space-y-4">
            <div className="text-sm font-medium text-provn-text">Select Amount (CAMP)</div>
            
            {/* Preset Amounts */}
            <div className="grid grid-cols-3 gap-2">
              {TIP_AMOUNTS.map((presetAmount) => (
                <ProvnButton
                  key={presetAmount}
                  variant={amount === presetAmount && !customAmount ? "primary" : "secondary"}
                  size="sm"
                  onClick={() => selectPresetAmount(presetAmount)}
                  className="h-10"
                >
                  {presetAmount} CAMP
                </ProvnButton>
              ))}
            </div>

            {/* Custom Amount */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-provn-text">
                Custom Amount
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={customAmount}
                  onChange={(e) => handleCustomAmountChange(e.target.value)}
                  placeholder="Enter custom amount"
                  className="w-full px-4 py-3 bg-provn-surface-2 border border-provn-border rounded-lg text-provn-text placeholder-provn-muted focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent pr-16"
                  maxLength={10}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-provn-muted">
                  CAMP
                </div>
              </div>
              <div className="text-xs text-provn-muted">
                Min: 0.01 CAMP • Max: 1000 CAMP
              </div>
            </div>
          </div>

          {/* Total Display */}
          <div className="bg-provn-surface-2 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <span className="text-provn-muted">Total Amount:</span>
              <span className="text-xl font-bold text-orange-500">
                {(customAmount ? parseFloat(customAmount) || 0 : amount).toFixed(2)} CAMP
              </span>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="text-xs text-provn-muted bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <span className="text-yellow-500 mt-0.5">⚠️</span>
              <div>
                Tips are sent directly to the creator's wallet and cannot be reversed. 
                Please verify the amount before confirming.
              </div>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-provn-border bg-provn-surface-2">
          <ProvnButton variant="secondary" onClick={onClose} disabled={isLoading}>
            Cancel
          </ProvnButton>
          <ProvnButton 
            onClick={handleTip} 
            disabled={isLoading || (customAmount ? !parseFloat(customAmount) : !amount)}
            className="bg-orange-500 hover:bg-orange-600"
          >
            {isLoading ? (
              'Sending...'
            ) : (
              <>
                <span className="w-4 h-4 mr-2">⚡</span>
                Send Tip
              </>
            )}
          </ProvnButton>
        </div>
      </div>
    </div>
  );
}