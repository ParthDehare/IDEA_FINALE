const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Disable package exports to bypass subpath resolution issues in Metro / Node modules
if (config.resolver) {
  config.resolver.unstable_enablePackageExports = false;
}

module.exports = config;
