import React, { useState, useEffect } from 'react';
import { useBot } from '../../context/BotContext';
import { QrCode, Copy, Check, Clock, ShieldCheck, CheckCircle2, Download, ExternalLink, RefreshCw, Zap, Sparkles } from 'lucide-react';
import { generateQrDataUrl, buildUpiUri } from '../../utils/qrGenerator';

interface Props {
  orderInfo: {
    order_id: string;
    amount: number;
    upi_id: string;
    expires_at: number;
    qr_url?: string;
  };
  onClose?: () => void;
}

export const FamPayModal: React.FC<Props> = ({ orderInfo, onClose }) => {
  const { simulatePaymentSuccess, checkFamGatewayStatus, transactions } = useBot();
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(300);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [localQrUrl, setLocalQrUrl] = useState<string>(orderInfo.qr_url || '');

  const txn = transactions.find(t => t.order_id === orderInfo.order_id);
  const isPaid = txn?.status === 'paid';

  const famGatewayPayUrl = `https://famgateway.in/pay.php?order_id=${orderInfo.order_id}&amount=${(Number(orderInfo.amount) || 0).toFixed(2)}`;

  const upiUri = buildUpiUri({
    upiId: orderInfo.upi_id || 'kalampanel@fam',
    payeeName: 'FamGateway Kalam Panel',
    amount: orderInfo.amount,
    orderId: orderInfo.order_id,
    note: `FamGateway Order ${orderInfo.order_id}`
  });

  // Always generate guaranteed local QR Data URL
  useEffect(() => {
    let isMounted = true;
    const loadQr = async () => {
      if (orderInfo.qr_url && orderInfo.qr_url.startsWith('data:image')) {
        setLocalQrUrl(orderInfo.qr_url);
        return;
      }
      try {
        const generated = await generateQrDataUrl(upiUri);
        if (isMounted && generated) {
          setLocalQrUrl(generated);
        }
      } catch (e) {
        if (isMounted && orderInfo.qr_url) {
          setLocalQrUrl(orderInfo.qr_url);
        }
      }
    };
    loadQr();
    return () => {
      isMounted = false;
    };
  }, [orderInfo.qr_url, upiUri]);

  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.floor((orderInfo.expires_at - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining <= 0) clearInterval(interval);
    }, 1000);
    return () => clearInterval(interval);
  }, [orderInfo.expires_at]);

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleCopyUPI = () => {
    navigator.clipboard.writeText(orderInfo.upi_id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCheckStatus = async () => {
    setIsChecking(true);
    try {
      await checkFamGatewayStatus(orderInfo.order_id);
    } finally {
      setIsChecking(false);
    }
  };

  const handleDownloadQr = () => {
    if (!localQrUrl) return;
    const a = document.createElement('a');
    a.href = localQrUrl;
    a.download = `FamGateway_QR_${orderInfo.order_id}.png`;
    a.click();
  };

  const handleSimulatePayment = async () => {
    setIsSimulating(true);
    setTimeout(async () => {
      await simulatePaymentSuccess(orderInfo.order_id);
      setIsSimulating(false);
      if (onClose) onClose();
    }, 1200);
  };

  return (
    <div className="bg-slate-900/95 border border-cyan-500/30 rounded-3xl p-5 md:p-6 max-w-sm mx-auto shadow-2xl text-center space-y-4 backdrop-blur-xl relative overflow-hidden">
      {/* Subtle Glow Effect */}
      <div className="absolute -top-24 -left-24 w-48 h-48 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />

      {/* Title Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3 relative z-10">
        <div className="flex items-center gap-2.5 text-left">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-400 via-teal-400 to-blue-500 text-slate-950 flex items-center justify-center font-black text-base shadow-lg shadow-cyan-500/30">
            ⚡
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-black text-white tracking-wide">FamGateway.in</h3>
              <span className="text-[9px] bg-cyan-500/20 text-cyan-300 font-bold px-1.5 py-0.5 rounded border border-cyan-500/30">
                Official
              </span>
            </div>
            <p className="text-[11px] font-mono text-slate-400">Order: {orderInfo.order_id}</p>
          </div>
        </div>

        {/* Countdown */}
        <div className={`flex items-center gap-1 text-xs font-mono font-bold px-2.5 py-1 rounded-full ${
          timeLeft < 60 ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
        }`}>
          <Clock className="w-3.5 h-3.5" />
          <span>{formatTimer(timeLeft)}</span>
        </div>
      </div>

      {/* QR Code Card */}
      <div className="relative p-3.5 bg-white rounded-2xl mx-auto w-52 h-52 flex flex-col items-center justify-center shadow-2xl ring-4 ring-cyan-500/20 transition-all z-10">
        {localQrUrl ? (
          <img
            src={localQrUrl}
            alt="Scan FamGateway QR Code to Pay"
            className="w-full h-full object-contain select-none"
            referrerPolicy="no-referrer"
            onError={async () => {
              try {
                const fallbackUrl = await generateQrDataUrl(upiUri);
                setLocalQrUrl(fallbackUrl);
              } catch (e) {
                // Ignore
              }
            }}
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-slate-400 gap-2">
            <QrCode className="w-20 h-20 text-slate-800 animate-pulse" />
            <span className="text-[10px] text-slate-600 font-semibold">Generating FamGateway QR...</span>
          </div>
        )}

        {isPaid && (
          <div className="absolute inset-0 bg-emerald-950/95 backdrop-blur-xs rounded-2xl flex flex-col items-center justify-center text-emerald-400 p-2 animate-in fade-in">
            <CheckCircle2 className="w-14 h-14 mb-1.5 text-emerald-400 animate-bounce" />
            <span className="font-extrabold text-sm tracking-wide">PAID & VERIFIED</span>
            <span className="text-[11px] text-emerald-300">Balance credited to wallet</span>
          </div>
        )}
      </div>

      {/* Primary Action Button: FamGateway Checkout */}
      <div className="flex flex-col gap-2 relative z-10">
        <a
          href={famGatewayPayUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 via-teal-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 transition active:scale-[0.98] cursor-pointer"
        >
          <ExternalLink className="w-4 h-4" />
          <span>Open FamGateway.in Checkout</span>
        </a>

        <div className="flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={handleDownloadQr}
            className="flex-1 px-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer border border-white/5"
          >
            <Download className="w-3.5 h-3.5" />
            Save QR
          </button>

          <a
            href={upiUri}
            className="flex-1 px-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-cyan-300 text-[11px] font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer border border-cyan-500/20"
          >
            <Zap className="w-3.5 h-3.5" />
            UPI App
          </a>
        </div>
      </div>

      {/* Amount & UPI Details */}
      <div className="bg-slate-950/80 rounded-2xl p-3 border border-white/10 text-left space-y-2 relative z-10">
        <div className="flex justify-between items-center text-xs">
          <span className="text-slate-400">Total Amount:</span>
          <span className="text-base font-black text-emerald-400">₹{(Number(orderInfo?.amount) || 0).toFixed(2)}</span>
        </div>

        <div className="flex justify-between items-center text-xs pt-1.5 border-t border-slate-800">
          <span className="text-slate-400">UPI ID:</span>
          <button
            type="button"
            onClick={handleCopyUPI}
            className="flex items-center gap-1.5 font-mono text-cyan-300 hover:text-cyan-200 bg-slate-900 border border-cyan-500/30 px-2 py-0.5 rounded-md cursor-pointer text-xs"
            title="Click to copy UPI ID"
          >
            <span>{orderInfo.upi_id}</span>
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Supported UPI Apps Row */}
      <div className="pt-1 relative z-10">
        <p className="text-[10px] text-slate-400 flex items-center justify-center gap-1 mb-2 font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>FamGateway Automated Auto-Credit Engine</span>
        </p>
        <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400 font-mono">
          <span className="px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700/50">FamPay</span>
          <span className="px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700/50">PhonePe</span>
          <span className="px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700/50">Paytm</span>
          <span className="px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700/50">GPay</span>
        </div>
      </div>

      {/* Check Status & Simulate Buttons */}
      <div className="space-y-2 pt-1 relative z-10">
        {!isPaid && (
          <button
            type="button"
            disabled={isChecking}
            onClick={handleCheckStatus}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-white/10 text-white font-bold text-xs transition-all shadow-md active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`} />
            <span>{isChecking ? 'Verifying with FamGateway...' : '🔄 Auto-Verify Payment'}</span>
          </button>
        )}

        {!isPaid && (
          <button
            type="button"
            disabled={isSimulating}
            onClick={handleSimulatePayment}
            className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-[11px] transition-all shadow-md active:scale-[0.98] cursor-pointer disabled:opacity-50"
          >
            {isSimulating ? "Crediting Wallet..." : "⚡ Simulate Successful Payment (Instant Test)"}
          </button>
        )}
      </div>
    </div>
  );
};

