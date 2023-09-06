/** @type {import('next').NextConfig} */
const nextConfig = {
    env: {
        OPENCAGE_API_KEY: process.env.OPENCAGE_API_KEY
    }
}

module.exports = nextConfig
