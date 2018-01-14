class WoopackAngularJSPlugin {
  constructor() {
    this.eventName = 'webpack-js-loaders-configuration-for-browser';
    this.frameworkProperty = 'angularjs';
    this.loaderName = 'ng-annotate-loader';
    this.babelLoaderName = 'babel-loader';
    this.babelRequiredIncludedFeatures = [
      'transform-es2015-arrow-functions',
      'transform-es2015-classes',
      'transform-es2015-parameters',
    ];
  }

  register(app) {
    const events = app.get('events');
    events.on(
      this.eventName,
      (loaders, params) => this.updateLoaders(loaders, params.target)
    );
  }

  updateLoaders(currentLoaders, target) {
    let updatedLoaders;
    if (
      target.is.browser &&
      target.framework === this.frameworkProperty &&
      currentLoaders.length
    ) {
      updatedLoaders = currentLoaders.slice();
      const [baseJSLoader] = updatedLoaders;
      baseJSLoader.use.unshift(this.loaderName);
      const babelLoaderIndex = this._findBabelLoaderIndex(baseJSLoader.use);
      if (babelLoaderIndex > -1) {
        baseJSLoader.use[babelLoaderIndex] = this._updateBabelLoader(
          baseJSLoader.use[babelLoaderIndex]
        );
      }
    } else {
      updatedLoaders = currentLoaders;
    }

    return updatedLoaders;
  }

  _findBabelLoaderIndex(loaders) {
    return loaders.findIndex((loader) => {
      const isString = typeof loader === 'string';
      return (isString && loader === this.babelLoaderName) ||
        (!isString && loader.loader === this.babelLoaderName);
    });
  }

  _updateBabelLoader(babelLoader) {
    let updatedLoader;
    /**
     * If the loader is a `string` or it doesn't have an `options` property, then the project uses
     * an external `.babelrc`.
     */
    if (typeof babelLoader !== 'string' && babelLoader.options) {
      const { options } = babelLoader;
      let needsPresets = false;
      let hasEnvPreset = false;
      let envPresetIndex = -1;
      if (options.presets && options.presets.length) {
        envPresetIndex = options.presets.findIndex((preset) => {
          const [presentName] = preset;
          return presentName === 'env';
        });

        hasEnvPreset = envPresetIndex > -1;
      } else {
        needsPresets = true;
      }

      if (needsPresets || hasEnvPreset) {
        let presetOptions;
        if (needsPresets) {
          presetOptions = {};
        } else {
          const [, currentEnvPresetOptions] = options.presets[envPresetIndex];
          presetOptions = Object.assign({}, currentEnvPresetOptions);
        }

        if (presetOptions.include) {
          this.babelRequiredIncludedFeatures.forEach((feature) => {
            if (!presetOptions.include.includes(feature)) {
              presetOptions.include.push(feature);
            }
          });
        } else {
          presetOptions.include = this.babelRequiredIncludedFeatures.slice();
        }

        updatedLoader = Object.assign({}, babelLoader);
        if (needsPresets) {
          updatedLoader.options.presets = [['env', presetOptions]];
        } else {
          updatedLoader.options.presets[envPresetIndex] = ['env', presetOptions];
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

module.exports = WoopackAngularJSPlugin;
