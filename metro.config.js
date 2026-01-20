const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add support for web-ifc WASM files
config.resolver.assetExts.push('wasm');

// Configure source extensions
config.resolver.sourceExts = [...config.resolver.sourceExts, 'mjs'];

module.exports = config;
