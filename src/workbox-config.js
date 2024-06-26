module.exports = {
  globDirectory: "../src",
  globPatterns: ["**/*.{html,js,css,png,svg,jpg,gif,json,woff,woff2,eot,ico,webmanifest,map}"],
  swDest: "../build/serviceWorker.js",
  clientsClaim: true,
  skipWaiting: true,
};
