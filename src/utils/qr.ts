/**
 * QR Code and Verification URL Utilities for Sarkarpara Welfare Association
 */

/**
 * Generates the full public verification URL for a given member ID.
 * Example: https://example.com/?verify=MEM-0001
 */
export function getMemberVerificationUrl(memberId: string): string {
  if (typeof window !== 'undefined' && window.location) {
    const origin = window.location.origin;
    const pathname = window.location.pathname;
    return `${origin}${pathname}?verify=${encodeURIComponent(memberId)}`;
  }
  return `/?verify=${encodeURIComponent(memberId)}`;
}

/**
 * Downloads a rendered canvas or SVG element as an image file.
 */
export function downloadQRCodeImage(svgId: string, filename: string = 'member-qr.svg'): void {
  const svgElement = document.getElementById(svgId);
  if (!svgElement) return;

  const svgData = new XMLSerializer().serializeToString(svgElement);
  const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
  const svgUrl = URL.createObjectURL(svgBlob);

  const downloadLink = document.createElement('a');
  downloadLink.href = svgUrl;
  downloadLink.download = filename;
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
  URL.revokeObjectURL(svgUrl);
}
