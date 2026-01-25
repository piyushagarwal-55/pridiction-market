/** @type {import('next').NextConfig} */

const nextConfig = {
    typedRoutes: true,
    output: 'standalone',
    experimental: {
        optimizePackageImports: ['viem', 'wagmi'],
        serverComponentsExternalPackages: ['@walletconnect/sign-client']
    },
    transpilePackages: ['@sportsbook/types'],
    webpack: (config, { isServer }) => {
        // Handle pino-pretty as optional dependency for production builds
        if (isServer) {
            config.externals.push('pino-pretty', 'lokijs', 'encoding')
        }
        
        // Fix for WalletConnect and other ESM-only packages
        config.resolve.fallback = {
            ...config.resolve.fallback,
            fs: false,
            net: false,
            tls: false,
        }
        
        return config
    },
    async headers() {
        return [
            {
                source: '/:path*',
                headers: [
                    { key: 'Access-Control-Allow-Credentials', value: 'true' },
                    { key: 'Access-Control-Allow-Origin', value: '*' },
                    { key: 'Access-Control-Allow-Methods', value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT' },
                    { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version' },
                ],
            },
        ];
    },
    async redirects() {
        return [
            {
                source: '/.well-known/farcaster.json',
                destination: 'https://api.farcaster.xyz/miniapps/hosted-manifest/019bf3c8-e9f1-8d2d-cf72-ffed3e3c026e',
                permanent: false,
            },
        ];
    },
}

module.exports = nextConfig
