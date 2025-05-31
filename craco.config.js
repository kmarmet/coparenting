module.exports = {
  eslint: {
    enable: false,
  },
  webpack: {
    configure: {
      entry: './src/index.js',
    },
  },
  babel: {
    loaderOptions: {
      //Enable babel-loader cache:
      cacheDirectory: true, //This is the correct location for cacheDirectory (it was wrong in the question)
      //Compress cache which improves launch speed at the expense of disk space:
      cacheCompression: false,
    },
  },
}