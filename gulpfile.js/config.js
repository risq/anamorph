module.exports = {
  root: {
    src: './src',
    dest: './public',
  },

  tasks: {
    browserSync: {
      server: {
        baseDir: 'public',
        middleware: function(req, res, next) {
          require('../app')(req, res, next);
        },
      },
    },

    static: {
      src: 'static',
      dest: './',
    },

    js: {
      src: 'javascripts',
      dest: 'javascripts',
      extractSharedJs: false,
      entries: {
        app: ['./app.js'],
        remote: ['./remote.js'],
        display: ['./display.js'],
      },
      extensions: ['js'],
    },

    css: {
      src: 'stylesheets',
      dest: 'stylesheets',
      autoprefixer: {
        browsers: ['last 3 version'],
      },
      sass: {
        indentedSyntax: true,
      },
      extensions: ['sass', 'scss', 'css'],
    },

    html: {
      src: 'html',
      dest: './',
      dataFile: 'data/global.json',
      htmlmin: {
        collapseWhitespace: true,
      },
      extensions: ['html', 'json'],
      excludeFolders: ['layouts', 'shared', 'macros', 'data'],
    },

    images: {
      src: 'images',
      dest: 'images',
      extensions: ['jpg', 'png', 'svg', 'gif'],
    },

    fonts: {
      src: 'fonts',
      dest: 'fonts',
      extensions: ['woff2', 'woff', 'eot', 'ttf', 'svg'],
    },

    iconFont: {
      src: 'icons',
      dest: 'fonts',
      sassDest: 'generated',
      extensions: ['woff2', 'woff', 'eot', 'ttf', 'svg'],
    },

    svgSprite: {
      src: 'sprites',
      dest: 'images',
      extensions: ['svg'],
    },
  },
};
