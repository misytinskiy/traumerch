import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    minimumCacheTTL: 60 * 60 * 24 * 31,
    formats: ["image/webp"],
    // По умолчанию Next предлагает восемь ширин вплоть до 3840. Исходники
    // товаров в Airtable около 1000-2000px, то есть вариант на 3840 возвращает
    // тот же файл, но занимает отдельную запись в кеше, которую кто-то должен
    // прогреть. Чем меньше вариантов, тем выше попадание в кеш — а холодные
    // промахи здесь и есть основная задержка.
    deviceSizes: [640, 828, 1080, 1920],
    imageSizes: [96, 128, 256, 384],
    qualities: [70, 75, 80, 85, 90, 95, 100],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "dl.airtableusercontent.com",
      },
      {
        protocol: "https",
        hostname: "v5.airtableusercontent.com",
      },
      {
        protocol: "https",
        hostname: "airtableusercontent.com",
      },
    ],
  },
  async headers() {
    return [
      {
        // Имена файлов в /media содержат хеш содержимого: замена фотографии
        // даёт новое имя, поэтому старое можно кешировать неограниченно.
        // Без этого Next отдаёт всё из public/ с max-age=0, и каждая
        // страница заново тянет все картинки с origin.
        source: "/media/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Content-Security-Policy", value: "default-src 'self'; img-src 'self' https: data: blob:; media-src 'self' https: data: blob:; script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; style-src 'self' 'unsafe-inline' https:; connect-src 'self' https:; font-src 'self' https: data:; frame-src 'self' https://calendly.com https://*.calendly.com https://assets.calendly.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self';" },
        ],
      },
    ];
  },
};

export default nextConfig;
