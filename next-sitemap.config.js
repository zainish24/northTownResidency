/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: 'https://karachiestates.com',
  generateRobotsTxt: true,
  sitemapSize: 5000,
  changefreq: 'daily',
  priority: 0.7,
  exclude: [
    '/admin',
    '/admin/*',
    '/dashboard',
    '/dashboard/*',
    '/auth/*',
    '/api/*',
  ],
  additionalPaths: async (config) => [
    { loc: '/', changefreq: 'daily', priority: 1.0 },
    { loc: '/listings', changefreq: 'daily', priority: 0.9 },
    { loc: '/auth/login', changefreq: 'monthly', priority: 0.5 },
    { loc: '/auth/signup', changefreq: 'monthly', priority: 0.5 },
  ],
  robotsTxtOptions: {
    policies: [
      { userAgent: '*', allow: '/' },
      { userAgent: '*', disallow: ['/admin', '/dashboard', '/api', '/auth'] },
    ],
  },
}
