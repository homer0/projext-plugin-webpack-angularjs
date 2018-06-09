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
  });

  it('should register the listeners for the webpack plugin', () => {
    // Given
    const events = {
      on: jest.fn(),
    };
    const babelHelper = 'babelHelper';
    const services = {
      events,
      babelHelper,
    };
    const app = {
      get: jest.fn((service) => services[service]),
    };
    let sut = null;
    const expectedEvents = [
      'babel-configuration',
      'webpack-externals-configuration',
      'target-default-html-settings',
    ];
    const expectedServices = Object.keys(services);
    // When
    sut = new ProjextAngularJSPlugin();
    sut.register(app);
    // Then
    expect(app.get).toHaveBeenCalledTimes(expectedServices.length);
    expectedServices.forEach((service) => {
      expect(app.get).toHaveBeenCalledWith(service);
    });
    expect(events.on).toHaveBeenCalledTimes(expectedEvents.length);
    expectedEvents.forEach((eventName) => {
      expect(events.on).toHaveBeenCalledWith(eventName, expect.any(Function));
    });
  });

  it('shouldn\'t update a target Babel configuration if the framework setting is invalid', () => {
    // Given
    const events = {
      on: jest.fn(),
    };
    const targets = 'targets';
    const babelHelper = 'babelHelper';
    const services = {
      events,
      targets,
      babelHelper,
    };
    const app = {
      get: jest.fn((service) => services[service]),
    };
    const target = {
      framework: 'react',
    };
    const initialBabelConfiguration = 'current-babel-configuration';
    let sut = null;
    let reducer = null;
    let result = null;
    // When
    sut = new ProjextAngularJSPlugin();
    sut.register(app);
    [[, reducer]] = events.on.mock.calls;
    result = reducer(initialBabelConfiguration, { target });
    // Then
    expect(result).toBe(initialBabelConfiguration);
  });

  it('should add the annotations preset to the Babel configuration', () => {
    // Given
    const events = {
      on: jest.fn(),
    };
    const targets = 'targets';
    const babelHelper = {
      addEnvPresetFeature: jest.fn((config, features) => Object.assign({}, config, { features })),
      addPlugin: jest.fn((config, name) => Object.assign({}, config, { plugin: name })),
    };
    const services = {
      events,
      targets,
      babelHelper,
    };
    const app = {
      get: jest.fn((service) => services[service]),
    };
    const target = {
      framework: 'angularjs',
      target: {
        is: {
          browser: true,
        },
      },
    };
    const initialBabelConfiguration = {};
    let sut = null;
    let reducer = null;
    let result = null;
    const expectedConfigWithEnvFeatures = Object.assign({}, initialBabelConfiguration, {
      features: [
        'transform-es2015-arrow-functions',
        'transform-es2015-classes',
        'transform-es2015-parameters',
      ],
    });
    const expectedConfigWithPlugin = Object.assign({}, expectedConfigWithEnvFeatures, {
      plugin: ['angularjs-annotate', { explicitOnly: true }],
    });
    // When
    sut = new ProjextAngularJSPlugin();
    sut.register(app);
    [[, reducer]] = events.on.mock.calls;
    result = reducer(initialBabelConfiguration, target);
    // Then
    expect(result).toEqual(expectedConfigWithPlugin);
    expect(babelHelper.addEnvPresetFeature).toHaveBeenCalledTimes(1);
    expect(babelHelper.addEnvPresetFeature).toHaveBeenCalledWith(
      initialBabelConfiguration,
      [
        'transform-es2015-arrow-functions',
        'transform-es2015-classes',
        'transform-es2015-parameters',
      ]
    );
    expect(babelHelper.addPlugin).toHaveBeenCalledTimes(1);
    expect(babelHelper.addPlugin).toHaveBeenCalledWith(
      expectedConfigWithEnvFeatures,
      ['angularjs-annotate', { explicitOnly: true }]
    );
  });

  it('should update the settings for a browser taget default HTML', () => {
    // Given
    const events = {
      on: jest.fn(),
    };
    const babelHelper = 'babelHelper';
    const services = {
      events,
      babelHelper,
    };
    const app = {
      get: jest.fn((service) => services[service]),
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
      bodyContents: '<main></main>',
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
    const babelHelper = 'babelHelper';
    const services = {
      events,
      babelHelper,
    };
    const app = {
      get: jest.fn((service) => services[service]),
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
    const babelHelper = 'babelHelper';
    const services = {
      events,
      babelHelper,
    };
    const app = {
      get: jest.fn((service) => services[service]),
    };
    const targetName = 'my-target';
    const frameworkOptions = {
      title: 'My App',
      appName: 'myCustomApp',
      strict: false,
      cloak: false,
      useBody: false,
      mainComponent: null,
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
    const expectedSettings = {
      title: frameworkOptions.title,
      bodyAttributes: '',
      bodyContents: `
        <div id="app" ng-app="${frameworkOptions.appName}"></div>
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

  it('shouldn\'t modify a target externals if the framework setting is invalid', () => {
    // Given
    const events = {
      on: jest.fn(),
    };
    const babelHelper = 'babelHelper';
    const services = {
      events,
      babelHelper,
    };
    const app = {
      get: jest.fn((service) => services[service]),
    };
    const target = {
      framework: 'react',
    };
    const initialExternals = {};
    let sut = null;
    let reducer = null;
    let result = null;
    // When
    sut = new ProjextAngularJSPlugin();
    sut.register(app);
    [,, [, reducer]] = events.on.mock.calls;
    result = reducer(initialExternals, { target });
    // Then
    expect(result).toEqual(initialExternals);
  });

  it('shouldn\'t modify a target externals if the target is a browser app', () => {
    // Given
    const events = {
      on: jest.fn(),
    };
    const babelHelper = 'babelHelper';
    const services = {
      events,
      babelHelper,
    };
    const app = {
      get: jest.fn((service) => services[service]),
    };
    const target = {
      framework: 'angularjs',
      is: {
        node: false,
      },
    };
    const initialExternals = {};
    let sut = null;
    let reducer = null;
    let result = null;
    // When
    sut = new ProjextAngularJSPlugin();
    sut.register(app);
    [,, [, reducer]] = events.on.mock.calls;
    result = reducer(initialExternals, { target });
    // Then
    expect(result).toEqual(initialExternals);
  });

  it('should include the AngularJS packages on the externals for a Node target', () => {
    // Given
    const events = {
      on: jest.fn(),
    };
    const babelHelper = 'babelHelper';
    const services = {
      events,
      babelHelper,
    };
    const app = {
      get: jest.fn((service) => services[service]),
    };
    const target = {
      framework: 'angularjs',
      is: {
        node: true,
      },
    };
    const initialExternals = {
      'colors/safe': 'commonjs colors/safe',
    };
    let sut = null;
    let reducer = null;
    let result = null;
    // When
    sut = new ProjextAngularJSPlugin();
    sut.register(app);
    [,, [, reducer]] = events.on.mock.calls;
    result = reducer(initialExternals, { target });
    // Then
    expect(result).toEqual(Object.assign({}, initialExternals, {
      angular: 'commonjs angular',
    }));
  });

  it('should include the AngularJS packages on the externals for a browser library target', () => {
    // Given
    const events = {
      on: jest.fn(),
    };
    const babelHelper = 'babelHelper';
    const services = {
      events,
      babelHelper,
    };
    const app = {
      get: jest.fn((service) => services[service]),
    };
    const target = {
      framework: 'angularjs',
      is: {
        node: false,
      },
      library: true,
    };
    const initialExternals = {
      'colors/safe': 'commonjs colors/safe',
    };
    let sut = null;
    let reducer = null;
    let result = null;
    // When
    sut = new ProjextAngularJSPlugin();
    sut.register(app);
    [,, [, reducer]] = events.on.mock.calls;
    result = reducer(initialExternals, { target });
    // Then
    expect(result).toEqual(Object.assign({}, initialExternals, {
      angular: 'commonjs angular',
    }));
  });
});
