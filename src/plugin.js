/**
 * This service is in charge of adding the required loader to handle AngularJS inject annotations
 * and updating a target Babel configuration so the loader will work.
 */
class ProjextAngularJSPlugin {
  /**
   * Class constructor.
   * @ignore
   */
  constructor() {
    /**
     * The name of the reducer event this service uses to intercept a rules configuration in order
     * to update it.
     * @type {string}
     */
    this.eventName = 'webpack-js-rules-configuration-for-browser';
    /**
     * The required value a target `framework` setting needs to have in order for the service to
     * take action.
     * @type {string}
     */
    this.frameworkProperty = 'angularjs';
    /**
     * The name of the loader the plugin adds to the Webpack configuration.
     * @type {string}
     */
    this.loaderName = 'ng-annotate-loader';
    /**
     * The name of the loader with the Babel configurations.
     * @type {string}
     */
    this.babelLoaderName = 'babel-loader';
    /**
     * The list of transformations the loader needs in order to work. The loader only works with
     * standard `function` statements, so it's necessary for Babel to transpile the following things
     * into `function`s so the loader can inject the annotations.
     * @type {Array}
     */
    this.babelRequiredIncludedFeatures = [
      'transform-es2015-arrow-functions',
      'transform-es2015-classes',
      'transform-es2015-parameters',
    ];
  }
  /**
   * This is the method called when the plugin is loaded by projext. It just gets the events service
   * and registers a listener for the reducer event that handles JS rules for browser targets.
   * @param {Projext} app The projext main container.
   */
  register(app) {
    const events = app.get('events');
    events.on(
      this.eventName,
      (rules, params) => this.updateRules(rules, params.target)
    );
  }
  /**
   * This method gets called when Projext reduces the JS rules for browser targets. It
   * validates the target, adds the plugin loader and modifies, if necessary, the configuration for
   * Babel.
   * @param {Array}  currentRules The list of JS rules for the Webpack configuration.
   * @param {Target} target         The target information.
   * @return {Array} The updated list of rules.
   */
  updateRules(currentRules, target) {
    let updatedRules;
    /**
     * If the target has a valid type, the right `framework` setting and there are rules
     * to modify...
     */
    if (
      target.is.browser &&
      target.framework === this.frameworkProperty &&
      currentRules.length
    ) {
      // ...copy the list of rules.
      updatedRules = currentRules.slice();
      // Get the first rule of the list (there's usually only one).
      const [baseJSRule] = updatedRules;
      // Push the AngularJS loader as first on the rule list of loaders.
      baseJSRule.use.unshift(this.loaderName);
      // Get the index of the Babel loader.
      const babelLoaderIndex = this._findBabelLoaderIndex(baseJSRule.use);
      // If the Babel loader is preset...
      if (babelLoaderIndex > -1) {
        // ...replace it with an updated version.
        baseJSRule.use[babelLoaderIndex] = this._updateBabelLoader(
          baseJSRule.use[babelLoaderIndex]
        );
      }
    } else {
      // ...otherwise, just set to return the received rules.
      updatedRules = currentRules;
    }

    return updatedRules;
  }
  /**
   * Finds the index of the Babel loader on a list of loaders.
   * @param {Array} loaders The list of loaders.
   * @return {number}
   * @ignore
   * @access protected
   */
  _findBabelLoaderIndex(loaders) {
    return loaders.findIndex((loader) => {
      const isString = typeof loader === 'string';
      return (isString && loader === this.babelLoaderName) ||
        (!isString && loader.loader === this.babelLoaderName);
    });
  }
  /**
   * Updates an existing Babel loader configuration with the required transformations the
   * AngularJS loader needs in order to work.
   * The method will only modify the loader if is not on a string format, has an `options`
   * object and doesn't have any preset or has the `env` preset.
   * @param {Object|string} babelLoader The loader to update.
   * @return {Object|string}
   * @ignore
   * @access protected
   */
  _updateBabelLoader(babelLoader) {
    let updatedLoader;
    /**
     * If the loader is a `string` or it doesn't have an `options` property, then the project uses
     * an external `.babelrc`, so it won't be updated.
     */
    if (typeof babelLoader !== 'string' && babelLoader.options) {
      // Access the loader options.
      const { options } = babelLoader;
      // Define some validation flags.
      let needsPresets = false;
      let hasEnvPreset = false;
      let envPresetIndex = -1;
      // If there are presets options...
      if (options.presets && options.presets.length) {
        // ...find the index of the `env` preset.
        envPresetIndex = options.presets.findIndex((preset) => {
          const [presetName] = preset;
          return presetName === 'env';
        });
        // Validate that the `env` preset is on the options.
        hasEnvPreset = envPresetIndex > -1;
      } else {
        // ...otherwise, the options needs presets.
        needsPresets = true;
      }
      // If there's an `env` preset to configure or no presets at all...
      if (needsPresets || hasEnvPreset) {
        // ...start updating the options.
        let presetOptions;
        // If there are no presets...
        if (needsPresets) {
          // ...create an empty object to work with.
          presetOptions = {};
        } else {
          // ...otherwise, get the current `env` preset configuration.
          const [, currentEnvPresetOptions] = options.presets[envPresetIndex];
          // copy the configuration into a new reference.
          presetOptions = Object.assign({}, currentEnvPresetOptions);
        }
        /**
         * From this point forward, we assume we have a configuration for the `env` preset.
         * If the configuration already has an `include` setting...
         */
        if (presetOptions.include) {
          // ...we only push the required transformations that are not already present.
          this.babelRequiredIncludedFeatures.forEach((feature) => {
            if (!presetOptions.include.includes(feature)) {
              presetOptions.include.push(feature);
            }
          });
        } else {
          // ...we copy the list of required transformations.
          presetOptions.include = this.babelRequiredIncludedFeatures.slice();
        }
        // Set the object to be returned as a copy of the one received.
        updatedLoader = Object.assign({}, babelLoader);
        // Declare the new `env` preset.
        const newEnvPreset = ['env', presetOptions];
        // If it didn't have any presets...
        if (needsPresets) {
          // ...create a new presets list with the new `env` preset.
          updatedLoader.options.presets = [newEnvPreset];
        } else {
          // ...otherwise, replace the existing `env` preset with the new and updated one.
          updatedLoader.options.presets[envPresetIndex] = newEnvPreset;
        }
      } else {
        updatedLoader = babelLoader;
      }
    } else {
      updatedLoader = babelLoader;
    }

    return updatedLoader;
  }
}

module.exports = ProjextAngularJSPlugin;
