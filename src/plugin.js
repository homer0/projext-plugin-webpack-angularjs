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
    this.rulesEventName = 'webpack-js-rules-configuration-for-browser';
    /**
     * The name of the reducer event this service uses to intercept a browser target default HTML
     * file settings and update them.
     * @type {string}
     */
    this.htmlSettingsEventName = 'target-default-html-settings';
    /**
     * The required value a target `framework` setting needs to have in order for the service to
     * take action.
     * @type {string}
     */
    this.frameworkProperty = 'angularjs';
    /**
     * The default values for the options a target can use to customize the default HTML projext
     * generates.
     * @type {Object}
     * @property {?string} title         A custom value for the `<title />` tag. If the target
     *                                   doesn't define it, the plugin will use the one projext
     *                                   sets by default (The name of the target).
     * @property {?string} appName       The value of the `ng-app` attribute. If the target
     *                                   doesn't define it, the plugin will convert the name of
     *                                   the target to `lowerCamelCase` and use that instead.
     * @property {boolean} strict        Whether the app tag should include the `ng-strict-di`
     *                                   directive or not.
     * @property {boolean} cloak         Whether the app tag should include the `ng-cloak`
     *                                   directive or not.
     * @property {boolean} useBody       Whether or not the `body` should be used as the app tag
     *                                   (`ng-app`).
     * @property {?string} mainComponent The name of a component that should be added inside the
     *                                   app tag.
     */
    this.frameworkOptions = {
      title: null,
      appName: null,
      strict: true,
      cloak: true,
      useBody: true,
      mainComponent: null,
    };
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
   * and registers the listeners for the reducer events that handle the JS rules for browser
   * targets and generate a target the default HTML file.
   * @param {Projext} app The projext main container.
   */
  register(app) {
    const events = app.get('events');
    // Rules event.
    events.on(
      this.rulesEventName,
      (rules, params) => this.updateRules(rules, params.target)
    );
    // HTML event.
    events.on(
      this.htmlSettingsEventName,
      (settings, target) => this.updateHTMLSettings(settings, target)
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
   * Read the settings projext is using to build browser target default HTML file and update them
   * based on the framework options defined by the target in order to run an AngularJS app.
   * @param {TargetDefaultHTMLSettings} currentSettings The settings projext uses to build a target
   *                                                    default HTML file.
   * @param {Target}                    target          The target information.
   * @return {TargetDefaultHTMLSettings}
   */
  updateHTMLSettings(currentSettings, target) {
    let updatedSettings;
    // If the target has a valid type and the right `framework`...
    if (target.is.browser && target.framework === this.frameworkProperty) {
      // ...copy the list of rules.
      updatedSettings = Object.assign({}, currentSettings);
      // Get a lowerCamelCase name for the AngularJS app by parsing the target name.
      const appName = target.name.replace(/-(\w)/ig, (match, letter) => letter.toUpperCase());
      // Merge the default options with any overwrite the framework may have.
      const options = Object.assign(
        {},
        this.frameworkOptions,
        { appName },
        (target.frameworkOptions || {})
      );
      // If there's a custom title on the options, set it.
      if (options.title) {
        updatedSettings.title = options.title;
      }

      // Define the attributes list of the app tag.
      const attributesList = [`ng-app="${options.appName}"`];
      // - Check if the app will run with strict mode.
      if (options.strict) {
        attributesList.push('ng-strict-di');
      }
      // - Check if the app should hide the template while rendering.
      if (options.cloak) {
        attributesList.push('ng-cloak');
      }
      // Format the attributes list into a string.
      const attributes = attributesList.join(' ');
      /**
       * If a main component was defined, generate an opening and closing tag for it, otherwise just
       * keep it as an empty string.
       */
      const mainComponent = options.mainComponent ?
        `<${options.mainComponent}></${options.mainComponent}>` :
        '';
      // If the app tag should be the `body`...
      if (options.useBody) {
        // ...set the app tag attributes to the `body`.
        updatedSettings.bodyAttributes = attributes;
        // Set the main component as the contents of the `body`.
        updatedSettings.bodyContents = mainComponent;
      } else {
        /**
         * ...otherwise, create `div` with the app tag attributes, with the main component inside it
         * and set it as the content of the `body`.
         */
        updatedSettings.bodyContents = `<div id="app" ${attributes}>${mainComponent}</div>`;
      }
    } else {
      // ...otherwise, just set to return the received settings.
      updatedSettings = currentSettings;
    }
    // Return the updated settings.
    return updatedSettings;
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
