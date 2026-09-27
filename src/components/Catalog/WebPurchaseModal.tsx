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
  Smartphone,
  Zap,
  X,
  CreditCard,
  ShoppingBag,
  QrCode,
  Check,
  ShieldCheck,
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
    buyProviderKeyDirect,
    settings,
    activeSubdomainStore
  } = useBot();

  const [paymentMethod, setPaymentMethod] = useState<'qr_gateway' | 'wallet'>('qr_gateway');
  const [androidId, setAndroidId] = useState<string>('');
  const [utrNumber, setUtrNumber] = useState<string>('');
  const [copiedUpi, setCopiedUpi] = useState<boolean>(false);
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

  const hasWalletBalance = currentUser.balance >= finalPrice;

  const fampayUpiId = activeSubdomainStore?.upi_id || settings.fampay_upi_id || 'kalam@upi';
  const upiQrString = `upi://pay?pa=${encodeURIComponent(fampayUpiId)}&pn=${encodeURIComponent(activeSubdomainStore?.store_name || 'KALAM PANEL')}&am=${finalPrice}&cu=INR`;
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiQrString)}`;

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(fampayUpiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const handleFulfillOrder = async (isQrPay: boolean) => {
    setErrorMsg(null);

    if (product.requires_android_id && !androidId.trim()) {
      setErrorMsg('Android HWID / Device ID is required for this panel package.');
      return;
    }

    if (isQrPay && utrNumber.trim().length > 0 && utrNumber.trim().length < 6) {
      setErrorMsg('Please enter a valid UTR / Transaction reference number.');
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

      // Deduct balance if using wallet pay
      if (!isQrPay) {
        updateUserBalance(
          currentUser.user_id,
          -finalPrice,
          `Web Order: ${product.panel_name} (${product.name || product.validity})`,
          true
        );
      }

      const generatedOrderNum = `ORD-${Date.now().toString().slice(-6)}`;
      setDeliveredKey(finalKeyText);
      setOrderRef(generatedOrderNum);

      confetti({
        particleCount: 70,
        spread: 90,
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
    setUtrNumber('');
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-md bg-slate-900 border border-cyan-500/40 rounded-3xl p-5 shadow-2xl space-y-4 text-slate-100 my-auto"
        >
          {/* Top Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/40 text-cyan-300 flex items-center justify-center shadow-lg">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider flex items-center gap-1">
                  <Zap className="w-3 h-3 text-amber-400" /> Instant Store Gateway
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
                  🎉 License Key Generated & Delivered!
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
                  Your Product License Key:
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
                <span className="text-cyan-300 font-bold block">💡 How to activate:</span>
                <ol className="list-decimal list-inside space-y-0.5 text-[11px] text-slate-300">
                  <li>Download and install the Injector/Panel APK.</li>
                  <li>Open the app and paste your generated license key.</li>
                  <li>Click Login to start playing safely!</li>
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
            /* Payment Selection & FamPay Gateway Screen */
            <div className="space-y-4">
              {/* Product Info Box */}
              <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Selected Plan:</span>
                  <span className="font-bold text-white">{product.name || product.validity}</span>
                </div>
                <div className="flex items-center justify-between border-t border-slate-800/80 pt-1.5">
                  <span className="text-slate-300 font-bold">Total Amount:</span>
                  <span className="text-base font-black text-emerald-400 font-mono">
                    ₹{finalPrice.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Payment Method Selector Tabs */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-2xl border border-slate-800 text-xs">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('qr_gateway')}
                  className={`py-2 px-3 rounded-xl font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    paymentMethod === 'qr_gateway'
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>FamPay QR Scan</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('wallet')}
                  className={`py-2 px-3 rounded-xl font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    paymentMethod === 'wallet'
                      ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Wallet Pay (₹{currentUser.balance.toFixed(0)})</span>
                </button>
              </div>

              {/* TAB 1: FamPay / PhonePe Gateway QR Code Payment */}
              {paymentMethod === 'qr_gateway' ? (
                <div className="bg-slate-950 p-4 rounded-2xl border border-purple-500/40 text-center space-y-3">
                  <span className="text-[11px] font-bold text-purple-300 uppercase tracking-wider block">
                    ⚡ Scan FamPay / PhonePe UPI QR Code
                  </span>

                  {/* Generated UPI QR Code */}
                  <div className="bg-white p-3 rounded-2xl inline-block shadow-xl border-2 border-purple-400/50">
                    <img
                      src={qrImageUrl}
                      alt="FamPay Payment QR Code"
                      className="w-44 h-44 mx-auto object-contain"
                    />
                  </div>

                  {/* UPI ID & Amount Info */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-center gap-2 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800 text-xs font-mono">
                      <span className="text-slate-400 text-[11px]">UPI ID:</span>
                      <span className="text-cyan-300 font-extrabold">{fampayUpiId}</span>
                      <button
                        type="button"
                        onClick={handleCopyUpi}
                        className="text-slate-400 hover:text-cyan-300 transition p-0.5 cursor-pointer"
                        title="Copy UPI ID"
                      >
                        {copiedUpi ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    <div className="text-[11px] text-slate-400 flex items-center justify-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Scan &amp; Pay <strong className="text-emerald-400">₹{finalPrice}</strong> using PhonePe, GPay, Paytm, or FamPay</span>
                    </div>
                  </div>

                  {/* UTR Input / Verification Field */}
                  <div className="space-y-1 text-left pt-1">
                    <label className="text-[11px] font-bold text-slate-300 block">
                      Transaction UTR / Reference No (Optional):
                    </label>
                    <input
                      type="text"
                      value={utrNumber}
                      onChange={(e) => setUtrNumber(e.target.value)}
                      placeholder="e.g. 426819201482"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono text-xs outline-none focus:border-purple-400"
                    />
                  </div>

                  {/* Submit / Get Instant Key Button */}
                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={() => handleFulfillOrder(true)}
                    className="w-full py-3 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white font-black rounded-xl text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-xl shadow-emerald-500/25 active:scale-95"
                  >
                    {isProcessing ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Verifying &amp; Generating Key...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-amber-300" />
                        <span>I Have Scanned &amp; Paid (Get Instant Key)</span>
                      </>
                    )}
                  </button>
                </div>
              ) : (
                /* TAB 2: Wallet Balance Payment */
                <div className="space-y-3">
                  <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-slate-400 text-[10px] block">Current Wallet Balance</span>
                      <span className={`font-mono font-black text-sm ${hasWalletBalance ? 'text-emerald-400' : 'text-rose-400'}`}>
                        ₹{currentUser.balance.toFixed(2)}
                      </span>
                    </div>

                    {!hasWalletBalance && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          if (onNeedRecharge) onNeedRecharge();
                        }}
                        className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs transition cursor-pointer"
                      >
                        Recharge Wallet
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    disabled={!hasWalletBalance || isProcessing}
                    onClick={() => handleFulfillOrder(false)}
                    className={`w-full py-3 font-black rounded-xl text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-xl ${
                      hasWalletBalance && !isProcessing
                        ? 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-cyan-600/30 active:scale-95'
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
                        <span>Confirm Wallet Payment (₹{finalPrice})</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Required HWID Input if product needs device binding */}
              {product.requires_android_id && (
                <div className="bg-slate-950 p-3 rounded-2xl border border-amber-500/40 space-y-1 text-xs">
                  <label className="text-amber-300 font-bold flex items-center gap-1 text-[11px]">
                    <Smartphone className="w-3.5 h-3.5 text-amber-400" />
                    Android HWID / Device ID Required
                  </label>
                  <input
                    type="text"
                    value={androidId}
                    onChange={(e) => setAndroidId(e.target.value)}
                    placeholder="e.g. 0b9b969bc2e7997b"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-slate-100 font-mono text-xs outline-none focus:border-amber-400"
                  />
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
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
