import QRCode from 'qrcode';

export interface UpiPaymentDetails {
  upiId: string;
  payeeName?: string;
  amount?: number;
  orderId?: string;
  note?: string;
}

/**
 * Builds a standardized, universally recognized NPCI / UPI payment URI scheme
 */
export function buildUpiUri(details: UpiPaymentDetails): string {
  const { upiId, payeeName = 'Kalam FF Panel', amount, orderId, note } = details;
  const cleanUpi = (upiId && upiId.trim()) ? upiId.trim() : 'kalampanel@fam';
  const cleanName = encodeURIComponent((payeeName && payeeName.trim()) ? payeeName.trim() : 'Kalam FF Panel');
  const cleanNote = encodeURIComponent(note || orderId || 'Wallet Deposit');

  let uri = `upi://pay?pa=${cleanUpi}&pn=${cleanName}&cu=INR&tn=${cleanNote}`;

  if (amount !== undefined && amount !== null && !isNaN(Number(amount)) && Number(amount) > 0) {
    uri += `&am=${Number(amount).toFixed(2)}`;
  }

  if (orderId) {
    uri += `&tr=${encodeURIComponent(orderId)}`;
  }

  return uri;
}

/**
 * Generates a high-quality Data URI PNG QR Code offline with PhonePe logo in the center
 */
export async function generateQrDataUrl(
  content: string,
  options?: {
    width?: number;
    margin?: number;
    darkColor?: string;
    lightColor?: string;
    addPhonePeLogo?: boolean;
    logoUrl?: string;
  }
): Promise<string> {
  const logoUrl = options?.logoUrl || 'https://img.icons8.com/color/512/phone-pe.png';
  const width = options?.width || 360;
  const shouldAddLogo = options?.addPhonePeLogo !== false;

  try {
    if (typeof document !== 'undefined') {
      const canvas = document.createElement('canvas');
      await QRCode.toCanvas(canvas, content, {
        width,
        margin: options?.margin !== undefined ? options.margin : 2,
        color: {
          dark: options?.darkColor || '#000000',
          light: options?.lightColor || '#ffffff',
        },
        errorCorrectionLevel: 'H',
      });

      if (shouldAddLogo) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const logoSize = Math.floor(width * 0.22);
          const x = (width - logoSize) / 2;
          const y = (width - logoSize) / 2;

          // Draw a clean rounded white background box for clear QR separation
          ctx.fillStyle = '#FFFFFF';
          const padding = 6;
          ctx.beginPath();
          if (typeof ctx.roundRect === 'function') {
            ctx.roundRect(x - padding, y - padding, logoSize + padding * 2, logoSize + padding * 2, 12);
          } else {
            ctx.rect(x - padding, y - padding, logoSize + padding * 2, logoSize + padding * 2);
          }
          ctx.fill();

          // Draw the custom QR logo image
          await new Promise<void>((resolve) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
              ctx.drawImage(img, x, y, logoSize, logoSize);
              resolve();
            };
            img.onerror = () => resolve();
            img.src = logoUrl;
          });
        }
      }
      return canvas.toDataURL('image/png');
    }
  } catch (err) {
    console.warn('Canvas QR generation with logo failed, using QuickChart fallback:', err);
  }

  // Fallback QuickChart URL with custom logo center
  const logoWidth = Math.floor(width * 0.22);
  return `https://quickchart.io/qr?text=${encodeURIComponent(content)}&size=${width}&margin=2&ecLevel=H&centerImageUrl=${encodeURIComponent(logoUrl)}&centerImageWidth=${logoWidth}&centerImageHeight=${logoWidth}`;
}

/**
 * Generates a scalable SVG string for the QR Code
 */
export async function generateQrSvg(
  content: string,
  options?: {
    width?: number;
    margin?: number;
  }
): Promise<string> {
  try {
    return await QRCode.toString(content, {
      type: 'svg',
      width: options?.width || 300,
      margin: options?.margin || 2,
      errorCorrectionLevel: 'M',
    });
  } catch (err) {
    console.error('Local SVG QR generation error:', err);
    return '';
  }
}
