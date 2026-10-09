import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // El circulito de Next.js (solo se ve en localhost) va a la derecha, para no tapar el globo del chat.
  devIndicators: { position: 'bottom-right' },
};

export default nextConfig;
