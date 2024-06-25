module.exports = {
  globDirectory: "dist",
  globPatterns: ["**/*.{html,js,css,png,svg,jpg,gif,json,woff,woff2,eot,ico,webmanifest,map}"],
  swDest: "dist/serviceWorker.js",
  clientsClaim: true,
  skipWaiting: true,
};
