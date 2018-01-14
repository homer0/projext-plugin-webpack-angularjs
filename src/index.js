const WoopackAngularJSPlugin = require('./plugin');

module.exports = (app) => {
  const plugin = new WoopackAngularJSPlugin();
  plugin.register(app);
};
