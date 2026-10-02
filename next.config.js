/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  // firebase-admin bundle na ho, Node ke runtime se hi chale (API route me use hota hai)
  experimental: { serverComponentsExternalPackages: ["firebase-admin"] },
};
