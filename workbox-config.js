module.exports = {
  globDirectory: "dist/",
  globPatterns: [
	"**/*.{html,js,css,png,svg,ico,json}"
  ],
  swDest: "dist/sw.js",
  clientsClaim: true,
  skipWaiting: true,
  runtimeCaching: [
	{
	  urlPattern: /\/api\//,
	  handler: 'NetworkFirst',
	  options: {
		cacheName: 'api-cache',
		expiration: {
		  maxEntries: 50,
		  maxAgeSeconds: 24 * 60 * 60
		}
	  }
	}
  ]
};
