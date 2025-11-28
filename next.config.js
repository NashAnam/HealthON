/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'export', // Required for Capacitor
    images: {
        unoptimized: true
    },
    typescript: {
        ignoreBuildErrors: true,
    },
    trailingSlash: true
}

module.exports = nextConfig