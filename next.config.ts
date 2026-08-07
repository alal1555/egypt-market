import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* You can leave this completely empty or keep your other marketplace parameters here */
  turbopack: {}, // Tells Next.js 16 you are intentionally running Turbopack cleanly
  
  // 🌟 ADD THIS LINE HERE TO UNBLOCK YOUR IP ADDRESS:
  allowedDevOrigins: ['192.168.8.100'],
};

export default nextConfig;