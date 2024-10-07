const cracoAlias = require('craco-alias')

module.exports = {
  eslint: null,
  plugins: [
    {
      plugin: cracoAlias,
      options: {
        baseUrl: './src',
        source: 'jsconfig',
      },
    },
  ],
}
