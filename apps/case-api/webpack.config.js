const { NxAppWebpackPlugin } = require('@nx/webpack/app-plugin');
const { join } = require('path');
const { IgnorePlugin } = require('webpack');

module.exports = {
  output: {
    path: join(__dirname, 'dist'),
    clean: true,
    ...(process.env.NODE_ENV !== 'production' && {
      devtoolModuleFilenameTemplate: '[absolute-resource-path]',
    }),
  },
  // Suppress known harmless warnings
  ignoreWarnings: [
    // Prisma generated client ships without .js.map files in some versions
    /Failed to parse source map.*generated\/prisma/,
  ],
  plugins: [
    // pg-native is an optional native addon for pg — not needed, ignore cleanly
    new IgnorePlugin({ resourceRegExp: /^pg-native$/ }),
    new NxAppWebpackPlugin({
      target: 'node',
      compiler: 'tsc',
      main: './src/main.ts',
      tsConfig: './tsconfig.app.json',
      assets: ['./src/assets'],
      optimization: false,
      outputHashing: 'none',
      generatePackageJson: false,
      sourceMap: true,
    }),
  ],
};
