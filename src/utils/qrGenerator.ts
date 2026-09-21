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
 * Generates a high-quality Data URI PNG QR Code offline without external network dependency
 */
export async function generateQrDataUrl(
  content: string,
  options?: {
    width?: number;
    margin?: number;
    darkColor?: string;
    lightColor?: string;
  }
): Promise<string> {
  try {
    const dataUrl = await QRCode.toDataURL(content, {
      width: options?.width || 360,
      margin: options?.margin !== undefined ? options.margin : 2,
      color: {
        dark: options?.darkColor || '#000000',
        light: options?.lightColor || '#ffffff',
      },
      errorCorrectionLevel: 'M',
    });
    return dataUrl;
  } catch (err) {
    console.error('Local QRCode generation error, falling back to public CDN:', err);
    return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(content)}`;
  }
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
