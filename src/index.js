const WoopackAngularJSPlugin = require('./plugin');
/**
 * This is the method called by Woopack when loading the plugin and it takes care of just creating
 * a new instance of the plugin main class and using it to register on Woopack.
 * @param {Woopack} app The Woopack main container.
 * @ignore
 */
const loadPlugin = (app) => {
  const plugin = new WoopackAngularJSPlugin();
  plugin.register(app);
};

module.exports = loadPlugin;
