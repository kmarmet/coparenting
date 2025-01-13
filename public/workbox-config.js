module.exports = {
  globDirectory: './',
  globPatterns: ['**/*.{html,js,css,png,svg,jpg,gif,json,woff,woff2,eot,ico,webmanifest,map}'],
  swDest: '../build/sw.js',
  clientsClaim: true,
  skipWaiting: true,
}

// module.exports = {
//   globDirectory: "../src",
//   globPatterns: ["**/*.{html,js,css,png,svg,jpg,gif,json,woff,woff2,eot,ico,webmanifest,map}"],
//   swDest: "../build/firebase-messaging-sw.js",
//   clientsClaim: true,
//   skipWaiting: true,
// };
