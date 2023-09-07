/** @type {import('next').NextConfig} */
const nextConfig = {
    env: {
        OPENCAGE_API_KEY: process.env.OPENCAGE_API_KEY,
        YELP_API_KEY: process.env.YELP_API_KEY
    }
}

module.exports = nextConfig
