import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  serverExternalPackages: ['@whiskeysockets/baileys', 'sharp', 'qrcode']
}

export default nextConfig
