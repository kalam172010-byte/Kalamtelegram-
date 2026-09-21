import React, { useState, useEffect } from 'react';
import { useBot } from '../../context/BotContext';
import { QrCode, Copy, Check, Clock, ShieldCheck, AlertCircle, CheckCircle2 } from 'lucide-react';

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
  const { simulatePaymentSuccess, transactions } = useBot();
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(300);
  const [isSimulating, setIsSimulating] = useState(false);

  const txn = transactions.find(t => t.order_id === orderInfo.order_id);
  const isPaid = txn?.status === 'paid';

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

  const handleSimulatePayment = async () => {
    setIsSimulating(true);
    setTimeout(async () => {
      await simulatePaymentSuccess(orderInfo.order_id);
      setIsSimulating(false);
      if (onClose) onClose();
    }, 1200);
  };

  return (
    <div className="bg-slate-900 border border-slate-700/80 rounded-2xl p-4 md:p-6 max-w-sm mx-auto shadow-2xl text-center space-y-4">
      {/* Title */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2 text-left">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-sm">
            FP
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">FamPay UPI Gateway</h3>
            <p className="text-[11px] text-slate-400">Order: {orderInfo.order_id}</p>
          </div>
        </div>

        {/* Countdown */}
        <div className={`flex items-center gap-1 text-xs font-mono font-bold px-2 py-1 rounded-full ${
          timeLeft < 60 ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-300'
        }`}>
          <Clock className="w-3.5 h-3.5" />
          <span>{formatTimer(timeLeft)}</span>
        </div>
      </div>

      {/* QR Code Container */}
      <div className="relative p-3 bg-white rounded-xl mx-auto w-48 h-48 flex items-center justify-center shadow-lg ring-4 ring-cyan-500/20">
        {orderInfo.qr_url ? (
          <img
            src={orderInfo.qr_url}
            alt="UPI QR Code"
            className="w-full h-full object-contain"
            referrerPolicy="no-referrer"
          />
        ) : (
          <QrCode className="w-36 h-36 text-slate-900" />
        )}

        {isPaid && (
          <div className="absolute inset-0 bg-emerald-950/90 backdrop-blur-xs rounded-xl flex flex-col items-center justify-center text-emerald-400 p-2 animate-in fade-in">
            <CheckCircle2 className="w-12 h-12 mb-1" />
            <span className="font-bold text-sm">PAID & VERIFIED</span>
          </div>
        )}
      </div>

      {/* Amount & UPI Details */}
      <div className="bg-slate-950/80 rounded-xl p-3 border border-slate-800 text-left space-y-2">
        <div className="flex justify-between items-center text-xs">
          <span className="text-slate-400">Amount Due:</span>
          <span className="text-base font-bold text-emerald-400">₹{orderInfo.amount.toFixed(2)}</span>
        </div>

        <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-800/80">
          <span className="text-slate-400">UPI ID:</span>
          <button
            type="button"
            onClick={handleCopyUPI}
            className="flex items-center gap-1 font-mono text-cyan-300 hover:text-cyan-200 bg-slate-900 px-2 py-0.5 rounded cursor-pointer"
          >
            <span>{orderInfo.upi_id}</span>
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* Instructions */}
      <p className="text-[11px] text-slate-400 flex items-center justify-center gap-1">
        <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
        <span>Pay with PhonePe, Paytm, GPay, or FamPay app</span>
      </p>

      {/* Simulation Trigger (Helps testing in preview) */}
      {!isPaid && (
        <button
          type="button"
          disabled={isSimulating}
          onClick={handleSimulatePayment}
          className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs md:text-sm transition-all shadow-md active:scale-[0.98] cursor-pointer disabled:opacity-50"
        >
          {isSimulating ? "Detecting Banking Confirmation..." : "⚡ Simulate Successful UPI Payment"}
        </button>
      )}
    </div>
  );
};
