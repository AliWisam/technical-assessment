const createExpoWebpackConfigAsync = require('@expo/webpack-config');

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync(env, argv);
  
  // Suppress the critical dependency warning for dynamic require
  config.ignoreWarnings = config.ignoreWarnings || [];
  config.ignoreWarnings.push({
    module: /src\/services\/api\.js/,
    message: /Critical dependency: require function/,
  });

  // Alternative: Suppress all critical dependency warnings
  // config.ignoreWarnings.push(/Critical dependency/);

  return config;
};
