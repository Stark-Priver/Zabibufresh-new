module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"], // Added expo-router plugin
  };
};
