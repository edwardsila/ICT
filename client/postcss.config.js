// PostCSS config updated to use the new @tailwindcss/postcss plugin
// See: error message about Tailwind's PostCSS plugin move
module.exports = {
  plugins: [
    require('@tailwindcss/postcss'),
    require('autoprefixer')
  ]
}

