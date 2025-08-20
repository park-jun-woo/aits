// postcss.config.js
module.exports = {
  plugins: [
    require('postcss-import'),
    require('postcss-nested'),
    require('postcss-custom-media'),
    require('postcss-preset-env')({
      stage: 2,
      features: {
        'nesting-rules': true,
        'custom-properties': true,
        'custom-media-queries': true,
        'is-pseudo-class': true,
        'has-pseudo-class': true
      }
    }),
    process.env.NODE_ENV === 'production' && require('cssnano')({
      preset: ['default', {
        discardComments: {
          removeAll: true
        },
        normalizeWhitespace: true
      }]
    })
  ].filter(Boolean)
};