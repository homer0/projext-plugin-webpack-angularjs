/**
 * It updates targets Babel configuration in order to add support for AngularJS annotations.
 */
class ProjextAngularJSPlugin {
  /**
   * Class constructor.
   */
  constructor() {
    /**
     * The name of the reducer event the service will listen for in order to exclude AngularJS
     * packages from the bundle when the target is a library.
     * @type {string}
     * @access protected
     * @ignore
     */
    this._externalSettingsEventName = 'webpack-externals-configuration';
    /**
     * The list of AngularJS packages that should never end up on the bundle if the target is a
     * library.
     * @type {Array}
     * @access protected
     * @ignore
     */
    this._externalModules = ['angular'];
    /**
     * The name of the reducer event the service will listen for in order to add support for
     * AngularJS annotations.
     * @type {string}
     * @access protected
     * @ignore
     */
    this._babelConfigurationEvent = 'babel-configuration';
    /**
     * The list of Babel plugins that need to be added in order to add support for AngularJS
     * annotations.
     * @type {Array}
     * @access protected
     * @ignore
     */
    this._babelPlugin = ['angularjs-annotate', { explicitOnly: true }];
    /**
     * The list of transformations the AngularJS annotations plugin needs in order to work. The
     * plugin only works with standard `function` statements, so it's necessary for Babel to
     * transpile the following things into `function`s so the annotations can be injected.
     * @type {Array}
     * @access protected
     * @ignore
     */
    this._babelRequiredEnvFeatures = [
      'transform-es2015-arrow-functions',
      'transform-es2015-classes',
      'transform-es2015-parameters',
    ];
    /**
     * The name of the reducer event the service uses to intercept a browser target default HTML
     * file settings.
     * @type {string}
     * @access protected
     * @ignore
     */
    this._htmlSettingsEventName = 'target-default-html-settings';
    /**
     * The required value a target `framework` setting needs to have in order for the service to
     * take action.
     * @type {string}
     * @access protected
     * @ignore
     */
    this._frameworkProperty = 'angularjs';
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
     * @access protected
     * @ignore
     */
    this._frameworkOptions = {
      title: null,
      appName: null,
      strict: true,
      cloak: true,
      useBody: true,
      mainComponent: 'main',
    };
  }
  /**
   * This is the method called when the plugin is loaded by projext. It setups all the listeners
   * for the events the plugin needs to intercept in order to:
   * 1. Add support for AngularJS annotations.
   * 2. Exclude AngularJS packages from the bundle when the target is a library.
   * 3. Generate the settings for a target default HTML.
   * @param {Projext} app The projext main container.
   */
  register(app) {
    // Get the `events` service to listen for the events.
    const events = app.get('events');
    // Get the `babelHelper` to send to the method that adds support for AngularJS annotations.
    const babelHelper = app.get('babelHelper');
    // Add the listener for the target Babel configuration.
    events.on(this._babelConfigurationEvent, (configuration, target) => (
      this._updateBabelConfiguration(configuration, target, babelHelper)
    ));
    // Add the listener for the default HTML settings.
    events.on(this._htmlSettingsEventName, (settings, target) => (
      this._updateHTMLSettings(settings, target)
    ));
    // Add the listener for the event that updates the external dependencies.
    events.on(this._externalSettingsEventName, (externals, params) => (
      this._updateExternals(externals, params.target)
    ));
  }
  /**
   * This method gets called when projext reduces a target Babel configuration. The method will
   * validate the target settings and add the Babel plugins needed for JSX.
   * @param {Object}      currentConfiguration The current Babel configuration for the target.
   * @param {Target}      target               The target information.
   * @param {BabelHelper} babelHelper          To update the target configuration and add the
   *                                           required preset and plugin.
   * @return {Object} The updated configuration.
   * @access protected
   * @ignore
   */
  _updateBabelConfiguration(currentConfiguration, target, babelHelper) {
    let updatedConfiguration;
    if (target.framework === this._frameworkProperty) {
      updatedConfiguration = babelHelper.addEnvPresetFeature(
        currentConfiguration,
        this._babelRequiredEnvFeatures
      );
      updatedConfiguration = babelHelper.addPlugin(
        updatedConfiguration,
        this._babelPlugin
      );
    } else {
      updatedConfiguration = currentConfiguration;
    }

    return updatedConfiguration;
  }
  /**
   * Read the settings projext is using to build browser target default HTML file and update them
   * based on the framework options defined by the target in order to run an AngularJS app.
   * @param {TargetDefaultHTMLSettings} currentSettings The settings projext uses to build a target
   *                                                    default HTML file.
   * @param {Target}                    target          The target information.
   * @return {TargetDefaultHTMLSettings}
   * @access protected
   * @ignore
   */
  _updateHTMLSettings(currentSettings, target) {
    let updatedSettings;
    // If the target has a valid type and the right `framework`...
    if (target.is.browser && target.framework === this._frameworkProperty) {
      // ...copy the list of rules.
      updatedSettings = Object.assign({}, currentSettings);
      // Get a lowerCamelCase name for the AngularJS app by parsing the target name.
      const appName = target.name.replace(/-(\w)/ig, (match, letter) => letter.toUpperCase());
      // Merge the default options with any overwrite the target may have.
      const options = Object.assign(
        {},
        this._frameworkOptions,
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
   * This method gets called when the webpack plugin reduces the list of modules that should be
   * handled as external dependencies. The method validates the target settings and if it's a
   * Node target or a browser library, it pushes the AngularJS packages to the list.
   * @param {Object} currentExternals A dictionary of external dependencies with the format
   *                                  webpack uses: `{ 'module': 'commonjs module'}`.
   * @param {Target} target           The target information.
   * @return {Object} The updated externals dictionary.
   * @access protected
   * @ignore
   */
  _updateExternals(currentExternals, target) {
    let updatedExternals;
    if (
      target.framework === this._frameworkProperty &&
      (target.is.node || target.library)
    ) {
      updatedExternals = Object.assign({}, currentExternals);
      this._externalModules.forEach((name) => {
        updatedExternals[name] = `commonjs ${name}`;
      });
    } else {
      updatedExternals = currentExternals;
    }

    return updatedExternals;
  }
}

module.exports = ProjextAngularJSPlugin;
