jest.unmock('/src/plugin');

require('jasmine-expect');

const ProjextAngularJSPlugin = require('/src/plugin');

describe('plugin:projextAngularJS/main', () => {
  it('should be instantiated', () => {
    // Given
    let sut = null;
    // When
    sut = new ProjextAngularJSPlugin();
    // Then
    expect(sut).toBeInstanceOf(ProjextAngularJSPlugin);
    expect(sut.rulesEventName).toBe('webpack-js-rules-configuration-for-browser');
    expect(sut.htmlSettingsEventName).toBe('target-default-html-settings');
    expect(sut.frameworkProperty).toBe('angularjs');
    expect(sut.frameworkOptions).toBeObject();
    expect(Object.keys(sut.frameworkOptions)).toEqual([
      'title',
      'appName',
      'strict',
      'cloak',
      'useBody',
      'mainComponent',
    ]);
    expect(sut.loaderName).toBe('ng-annotate-loader');
    expect(sut.babelLoaderName).toBe('babel-loader');
    expect(sut.babelRequiredIncludedFeatures).toEqual([
      'transform-es2015-arrow-functions',
      'transform-es2015-classes',
      'transform-es2015-parameters',
    ]);
  });

  it('should register the listeners for the Webpack plugin and the HTML settings', () => {
    // Given
    const events = {
      on: jest.fn(),
    };
    const app = {
      get: jest.fn(() => events),
    };
    let sut = null;
    const expectedEvents = [
      'webpack-js-rules-configuration-for-browser',
      'target-default-html-settings',
    ];
    // When
    sut = new ProjextAngularJSPlugin();
    sut.register(app);
    // Then
    expect(app.get).toHaveBeenCalledTimes(1);
    expect(app.get).toHaveBeenCalledWith('events');
    expect(events.on).toHaveBeenCalledTimes(expectedEvents.length);
    expectedEvents.forEach((eventName) => {
      expect(events.on).toHaveBeenCalledWith(eventName, expect.any(Function));
    });
  });

  it('should update the JS rules of a browser target', () => {
    // Given
    const events = {
      on: jest.fn(),
    };
    const app = {
      get: jest.fn(() => events),
    };
    const target = {
      is: {
        browser: true,
      },
      framework: 'angularjs',
    };
    const currentJSLoader = {
      test: /\.jsx?$/i,
      use: [
        'some-random-loader',
      ],
    };
    const currentRules = [currentJSLoader];
    let sut = null;
    let reducer = null;
    let result = null;
    const expectedLoaders = [Object.assign({}, currentJSLoader, {
      use: [
        'ng-annotate-loader',
        ...currentJSLoader.use,
      ],
    })];
    // When
    sut = new ProjextAngularJSPlugin();
    sut.register(app);
    [[, reducer]] = events.on.mock.calls;
    result = reducer(currentRules, { target });
    // Then
    expect(result).toEqual(expectedLoaders);
  });

  it('shouldn\'t modify the rules if the target is not for browser', () => {
    // Given
    const events = {
      on: jest.fn(),
    };
    const app = {
      get: jest.fn(() => events),
    };
    const target = {
      is: {
        browser: false,
      },
      framework: 'angularjs',
    };
    const currentRules = [{
      test: /\.jsx?$/i,
      use: [
        'some-random-loader',
      ],
    }];
    let sut = null;
    let reducer = null;
    let result = null;
    // When
    sut = new ProjextAngularJSPlugin();
    sut.register(app);
    [[, reducer]] = events.on.mock.calls;
    result = reducer(currentRules, { target });
    // Then
    expect(result).toEqual(currentRules);
  });

  it('should update the JS rules of a browser target and add the Babel required features', () => {
    // Given
    const events = {
      on: jest.fn(),
    };
    const app = {
      get: jest.fn(() => events),
    };
    const target = {
      is: {
        browser: true,
      },
      framework: 'angularjs',
    };
    const currentJSLoader = {
      test: /\.jsx?$/i,
      use: [
        {
          loader: 'babel-loader',
          options: {},
        },
      ],
    };
    const currentRules = [currentJSLoader];
    let sut = null;
    let reducer = null;
    let result = null;
    const expectedLoaders = [Object.assign({}, currentJSLoader, {
      use: [
        'ng-annotate-loader',
        {
          loader: 'babel-loader',
          options: {
            presets: [
              ['env', {
                include: [
                  'transform-es2015-arrow-functions',
                  'transform-es2015-classes',
                  'transform-es2015-parameters',
                ],
              }],
            ],
          },
        },
      ],
    })];
    // When
    sut = new ProjextAngularJSPlugin();
    sut.register(app);
    [[, reducer]] = events.on.mock.calls;
    result = reducer(currentRules, { target });
    // Then
    expect(result).toEqual(expectedLoaders);
  });

  it('shouldn\'t update the Babel config if it already has some presets', () => {
    // Given
    const events = {
      on: jest.fn(),
    };
    const app = {
      get: jest.fn(() => events),
    };
    const target = {
      is: {
        browser: true,
      },
      framework: 'angularjs',
    };
    const existingPresets = [
      ['preset-one'],
      ['preset-two'],
    ];
    const currentJSLoader = {
      test: /\.jsx?$/i,
      use: [
        {
          loader: 'babel-loader',
          options: {
            presets: [existingPresets],
          },
        },
      ],
    };
    const currentRules = [currentJSLoader];
    let sut = null;
    let reducer = null;
    let result = null;
    const expectedLoaders = [Object.assign({}, currentJSLoader, {
      use: [
        'ng-annotate-loader',
        ...currentJSLoader.use,
      ],
    })];
    // When
    sut = new ProjextAngularJSPlugin();
    sut.register(app);
    [[, reducer]] = events.on.mock.calls;
    result = reducer(currentRules, { target });
    // Then
    expect(result).toEqual(expectedLoaders);
  });

  it('should update an existing configuration of the Babel env preset', () => {
    // Given
    const events = {
      on: jest.fn(),
    };
    const app = {
      get: jest.fn(() => events),
    };
    const target = {
      is: {
        browser: true,
      },
      framework: 'angularjs',
    };
    const currentEnvPresetOptions = {
      target: {
        node: 'current',
      },
      include: [
        'transform-es2015-arrow-functions',
      ],
    };
    const currentJSLoader = {
      test: /\.jsx?$/i,
      use: [
        {
          loader: 'babel-loader',
          options: {
            presets: [
              ['env', currentEnvPresetOptions],
            ],
          },
        },
      ],
    };
    const currentRules = [currentJSLoader];
    let sut = null;
    let reducer = null;
    let result = null;
    const expectedLoaders = [Object.assign({}, currentJSLoader, {
      use: [
        'ng-annotate-loader',
        {
          loader: 'babel-loader',
          options: {
            presets: [
              ['env', {
                target: {
                  node: 'current',
                },
                include: [
                  'transform-es2015-arrow-functions',
                  'transform-es2015-classes',
                  'transform-es2015-parameters',
                ],
              }],
            ],
          },
        },
      ],
    })];
    // When
    sut = new ProjextAngularJSPlugin();
    sut.register(app);
    [[, reducer]] = events.on.mock.calls;
    result = reducer(currentRules, { target });
    // Then
    expect(result).toEqual(expectedLoaders);
  });

  it('shouldn\'t update the Babel config if the loader is set as a string', () => {
    // Given
    const events = {
      on: jest.fn(),
    };
    const app = {
      get: jest.fn(() => events),
    };
    const target = {
      is: {
        browser: true,
      },
      framework: 'angularjs',
    };
    const currentJSLoader = {
      test: /\.jsx?$/i,
      use: [
        'babel-loader',
      ],
    };
    const currentRules = [currentJSLoader];
    let sut = null;
    let reducer = null;
    let result = null;
    const expectedLoaders = [Object.assign({}, currentJSLoader, {
      use: [
        'ng-annotate-loader',
        ...currentJSLoader.use,
      ],
    })];
    // When
    sut = new ProjextAngularJSPlugin();
    sut.register(app);
    [[, reducer]] = events.on.mock.calls;
    result = reducer(currentRules, { target });
    // Then
    expect(result).toEqual(expectedLoaders);
  });

  it('shouldn\'t update the Babel config if the loader doesn\'t have an `options` key', () => {
    // Given
    const events = {
      on: jest.fn(),
    };
    const app = {
      get: jest.fn(() => events),
    };
    const target = {
      is: {
        browser: true,
      },
      framework: 'angularjs',
    };
    const currentJSLoader = {
      test: /\.jsx?$/i,
      use: [
        {
          loader: 'babel-loader',
        },
      ],
    };
    const currentRules = [currentJSLoader];
    let sut = null;
    let reducer = null;
    let result = null;
    const expectedLoaders = [Object.assign({}, currentJSLoader, {
      use: [
        'ng-annotate-loader',
        ...currentJSLoader.use,
      ],
    })];
    // When
    sut = new ProjextAngularJSPlugin();
    sut.register(app);
    [[, reducer]] = events.on.mock.calls;
    result = reducer(currentRules, { target });
    // Then
    expect(result).toEqual(expectedLoaders);
  });

  it('should update the settings for a browser taget default HTML', () => {
    // Given
    const events = {
      on: jest.fn(),
    };
    const app = {
      get: jest.fn(() => events),
    };
    const targetName = 'my-target';
    const normalizedTargetName = 'myTarget';
    const target = {
      name: targetName,
      is: {
        browser: true,
      },
      framework: 'angularjs',
    };
    const currentSettings = {
      title: 'my-title',
      bodyAttributes: '',
      bodyContents: '<div id="app"></div>',
    };
    let sut = null;
    let reducer = null;
    let result = null;
    const expectedSettings = {
      title: currentSettings.title,
      bodyAttributes: `ng-app="${normalizedTargetName}" ng-strict-di ng-cloak`,
      bodyContents: '',
    };
    // When
    sut = new ProjextAngularJSPlugin();
    sut.register(app);
    [, [, reducer]] = events.on.mock.calls;
    result = reducer(currentSettings, target);
    // Then
    expect(result).toEqual(expectedSettings);
  });

  it('shouldn\'t modify the HTML settings if the target is not for browser', () => {
    // Given
    const events = {
      on: jest.fn(),
    };
    const app = {
      get: jest.fn(() => events),
    };
    const target = {
      name: 'my-target',
      is: {
        browser: false,
      },
      framework: 'angularjs',
    };
    const currentSettings = {
      title: 'my-title',
      bodyAttributes: '',
      bodyContents: '<div id="app"></div>',
    };
    let sut = null;
    let reducer = null;
    let result = null;
    // When
    sut = new ProjextAngularJSPlugin();
    sut.register(app);
    [, [, reducer]] = events.on.mock.calls;
    result = reducer(currentSettings, target);
    // Then
    expect(result).toEqual(currentSettings);
  });

  it('should update the settings with custom options for a browser taget default HTML', () => {
    // Given
    const events = {
      on: jest.fn(),
    };
    const app = {
      get: jest.fn(() => events),
    };
    const targetName = 'my-target';
    const mainComponent = 'root-container';
    const frameworkOptions = {
      title: 'My App',
      appName: 'myCustomApp',
      strict: false,
      cloak: false,
      useBody: false,
      mainComponent,
    };
    const target = {
      name: targetName,
      is: {
        browser: true,
      },
      framework: 'angularjs',
      frameworkOptions,
    };
    const currentSettings = {
      title: 'my-title',
      bodyAttributes: '',
      bodyContents: '<div id="app"></div>',
    };
    let sut = null;
    let reducer = null;
    let result = null;
    const expectedMainComponent = `<${mainComponent}></${mainComponent}>`;
    const expectedSettings = {
      title: frameworkOptions.title,
      bodyAttributes: '',
      bodyContents: `
        <div id="app" ng-app="${frameworkOptions.appName}">${expectedMainComponent}</div>
      `.trim(),
    };
    // When
    sut = new ProjextAngularJSPlugin();
    sut.register(app);
    [, [, reducer]] = events.on.mock.calls;
    result = reducer(currentSettings, target);
    // Then
    expect(result).toEqual(expectedSettings);
  });
});
