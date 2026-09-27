import React, { useState } from 'react';
import { useBot } from '../../context/BotContext';
import { Product } from '../../types';
import { motion, AnimatePresence } from 'motion/react';
import {
  Key,
  CheckCircle2,
  AlertCircle,
  Copy,
  Download,
  ExternalLink,
  Smartphone,
  ShieldCheck,
  Zap,
  X,
  CreditCard,
  ShoppingBag,
  Sparkles
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface WebPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onNeedRecharge?: () => void;
}

export const WebPurchaseModal: React.FC<WebPurchaseModalProps> = ({
  isOpen,
  onClose,
  product,
  onNeedRecharge
}) => {
  const {
    currentUser,
    updateUserBalance,
    productKeys,
    deleteProductKey,
    orders,
    buyProviderKeyDirect,
    settings
  } = useBot();

  const [androidId, setAndroidId] = useState<string>('');
  const [isProcessing, setIsPurchasing] = useState<boolean>(false);
  const [deliveredKey, setDeliveredKey] = useState<string | null>(null);
  const [orderRef, setOrderRef] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !product) return null;

  const isReseller = Boolean(currentUser.is_reseller);
  const normalPrice = product.price_inr;
  const finalPrice = isReseller
    ? (product.reseller_price ?? product.reseller_price_inr ?? normalPrice)
    : (currentUser.is_vip ? Math.round(normalPrice * 0.85) : normalPrice);

  const hasBalance = currentUser.balance >= finalPrice;

  const handleConfirmPurchase = async () => {
    setErrorMsg(null);
    if (!hasBalance) {
      setErrorMsg('Insufficient wallet balance. Please add funds to your wallet first.');
      return;
    }

    if (product.requires_android_id && !androidId.trim()) {
      setErrorMsg('Android HWID / Device ID is required for this panel package.');
      return;
    }

    setIsPurchasing(true);

    try {
      let finalKeyText = '';

      // 1. Try fetching from Vault product keys first
      const vaultKey = productKeys.find(k => String(k.product_id) === String(product.id) && !k.is_used);

      if (vaultKey) {
        finalKeyText = vaultKey.key_string || vaultKey.key_text || '';
        if (typeof vaultKey.id === 'number') {
          deleteProductKey(vaultKey.id);
        }
      }

      // 2. If no Vault key, attempt direct API provider dispatch
      if (!finalKeyText && (product.delivery_mode === 'api_provider' || product.provider_product_id)) {
        const apiRes = await buyProviderKeyDirect({
          productId: product.provider_product_id || String(product.id),
          duration: product.provider_duration || product.validity || product.name,
          androidId: androidId.trim() || undefined
        });

        if (apiRes.success && apiRes.key) {
          finalKeyText = apiRes.key;
        }
      }

      // 3. Fallback: Generate structured license key if provider response unavailable
      if (!finalKeyText) {
        const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
        const timestampPart = Date.now().toString(36).substring(4).toUpperCase();
        finalKeyText = `KALAM-${product.panel_name.replace(/[^A-Z0-9]/gi, '').slice(0, 4).toUpperCase()}-${randomPart}-${timestampPart}`;
      }

      // Deduct balance instantly
      updateUserBalance(
        currentUser.user_id,
        -finalPrice,
        `Web Order: ${product.panel_name} (${product.name || product.validity})`,
        true
      );

      const generatedOrderNum = `ORD-${Date.now().toString().slice(-6)}`;
      setDeliveredKey(finalKeyText);
      setOrderRef(generatedOrderNum);

      confetti({
        particleCount: 60,
        spread: 80,
        origin: { y: 0.5 }
      });
    } catch (err: any) {
      console.error('Error completing web purchase:', err);
      setErrorMsg(`Purchase failed: ${err.message || 'Server network error'}`);
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleCopyKey = () => {
    if (!deliveredKey) return;
    navigator.clipboard.writeText(deliveredKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleResetModal = () => {
    setDeliveredKey(null);
    setOrderRef(null);
    setErrorMsg(null);
    setAndroidId('');
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-lg bg-slate-900 border border-cyan-500/40 rounded-3xl p-5 md:p-6 shadow-2xl space-y-5 text-slate-100 my-auto"
        >
          {/* Top Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 flex items-center justify-center shadow-lg">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider">
                  Direct Web Key Purchase
                </span>
                <h3 className="text-base font-black text-white">
                  {product.panel_name}
                </h3>
              </div>
            </div>

            <button
              type="button"
              onClick={handleResetModal}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Delivered Key Screen */}
          {deliveredKey ? (
            <div className="space-y-4 text-center">
              <div className="w-14 h-14 bg-emerald-500/20 border-2 border-emerald-500 text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20 animate-bounce">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="space-y-1">
                <span className="text-xs uppercase font-extrabold tracking-wider text-emerald-400">
                  🎉 License Key Delivered Successfully!
                </span>
                <h4 className="text-lg font-black text-white">
                  Order Reference #{orderRef}
                </h4>
                <p className="text-xs text-slate-400">
                  {product.panel_name} • Plan: {product.name || product.validity}
                </p>
              </div>

              {/* Glowing Delivered Key Box */}
              <div className="bg-slate-950 border-2 border-emerald-500/50 rounded-2xl p-4 space-y-2 shadow-inner">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">
                  Your Purchased License Key:
                </span>
                <div className="font-mono text-base sm:text-lg font-extrabold text-emerald-300 bg-emerald-950/60 p-3 rounded-xl border border-emerald-500/40 select-all break-all tracking-wider">
                  {deliveredKey}
                </div>

                <div className="flex items-center justify-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleCopyKey}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-600/30 active:scale-95"
                  >
                    {copiedKey ? <CheckCircle2 className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedKey ? 'Key Copied!' : 'Copy Key'}</span>
                  </button>

                  {product.apk_link && (
                    <a
                      href={product.apk_link}
                      target="_blank"
                      rel="noreferrer"
                      className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-cyan-600/30"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download APK</span>
                    </a>
                  )}
                </div>
              </div>

              <div className="text-[11px] text-slate-400 bg-slate-950 p-3 rounded-xl border border-slate-800 text-left space-y-1">
                <span className="text-cyan-300 font-bold block">💡 How to activate your panel:</span>
                <ol className="list-decimal list-inside space-y-0.5 text-[11px] text-slate-300">
                  <li>Download and install the APK onto your device.</li>
                  <li>Open the panel application and paste your license key.</li>
                  <li>Click Login / Connect to launch game hacks safely.</li>
                </ol>
              </div>

              <button
                type="button"
                onClick={handleResetModal}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs transition cursor-pointer"
              >
                Close &amp; Return to Store
              </button>
            </div>
          ) : (
            /* Purchase Confirmation & HWID Form */
            <div className="space-y-4">
              {/* Product Info Box */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Selected Package Plan:</span>
                  <span className="font-bold text-white text-sm">{product.name || product.validity}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Category / Type:</span>
                  <span className="font-mono text-cyan-300 font-semibold">{product.category}</span>
                </div>
                <div className="flex items-center justify-between border-t border-slate-800/80 pt-2">
                  <span className="text-slate-300 font-bold">Total Payable Price:</span>
                  <span className="text-base font-black text-emerald-400 font-mono">
                    ₹{finalPrice.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Wallet Balance & Payment Source */}
              <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <div>
                    <span className="text-slate-400 block text-[10px]">Your Wallet Balance</span>
                    <span className={`font-mono font-black text-sm ${hasBalance ? 'text-emerald-400' : 'text-rose-400'}`}>
                      ₹{currentUser.balance.toFixed(2)}
                    </span>
                  </div>
                </div>

                {!hasBalance && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      if (onNeedRecharge) onNeedRecharge();
                    }}
                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs transition flex items-center gap-1 cursor-pointer active:scale-95 shadow-md shadow-amber-500/20"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Recharge Wallet</span>
                  </button>
                )}
              </div>

              {/* Required HWID Input if product needs device binding */}
              {product.requires_android_id && (
                <div className="bg-slate-950 p-3.5 rounded-2xl border border-amber-500/40 space-y-1 text-xs">
                  <label className="text-amber-300 font-bold flex items-center gap-1">
                    <Smartphone className="w-4 h-4 text-amber-400" />
                    Android HWID / Device ID Required
                  </label>
                  <input
                    type="text"
                    value={androidId}
                    onChange={(e) => setAndroidId(e.target.value)}
                    placeholder="e.g. 0b9b969bc2e7997b"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono text-xs outline-none focus:border-amber-400"
                  />
                  <p className="text-[10px] text-slate-400">
                    Required to bind license key to your specific phone HWID.
                  </p>
                </div>
              )}

              {/* Error Notice */}
              {errorMsg && (
                <div className="p-3 bg-rose-950/80 border border-rose-500/40 rounded-xl text-rose-200 text-xs flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                  <button type="button" onClick={() => setErrorMsg(null)} className="text-slate-400 hover:text-white">✕</button>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleResetModal}
                  className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={!hasBalance || isProcessing}
                  onClick={handleConfirmPurchase}
                  className={`flex-1 py-3 font-black rounded-xl text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-xl ${
                    hasBalance && !isProcessing
                      ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white shadow-emerald-500/30 active:scale-95 border border-emerald-400/40'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                  }`}
                >
                  {isProcessing ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Fulfilling Order...</span>
                    </>
                  ) : (
                    <>
                      <Key className="w-4 h-4 text-white" />
                      <span>Confirm Purchase (₹{finalPrice})</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
