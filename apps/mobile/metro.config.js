const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;

const config = getDefaultConfig(projectRoot);

// Следим за shared пакетом чтобы изменения подхватывались в dev режиме
config.watchFolders = [
  path.resolve(projectRoot, '../../packages/shared'),
];

module.exports = config;
