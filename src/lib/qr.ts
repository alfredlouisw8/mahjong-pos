import QRCode from "qrcode"

export async function generateQRCodePNG(url: string): Promise<Buffer> {
  return QRCode.toBuffer(url, {
    type: "png",
    width: 300,
    margin: 2,
    color: { dark: "#000000", light: "#ffffff" },
  })
}

export async function generateQRCodeDataURL(url: string): Promise<string> {
  return QRCode.toDataURL(url, {
    width: 200,
    margin: 2,
  })
}

export function buildQRUrl(baseUrl: string, qrToken: string): string {
  return `${baseUrl}/${qrToken}`
}
