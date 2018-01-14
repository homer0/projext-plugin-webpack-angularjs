jest.unmock('/src/plugin');

require('jasmine-expect');

const WoopackAngularJSPlugin = require('/src/plugin');

describe('plugin:woopackAngularJS/main', () => {
  it('should be instantiated', () => {
    // Given
    let sut = null;
    // When
    sut = new WoopackAngularJSPlugin();
    // Then
    expect(sut).toBeInstanceOf(WoopackAngularJSPlugin);
    expect(sut.eventName).toBe('webpack-js-loaders-configuration-for-browser');
    expect(sut.frameworkProperty).toBe('angularjs');
    expect(sut.loaderName).toBe('ng-annotate-loader');
    expect(sut.babelLoaderName).toBe('babel-loader');
    expect(sut.babelRequiredIncludedFeatures).toEqual([
      'transform-es2015-arrow-functions',
      'transform-es2015-classes',
      'transform-es2015-parameters',
    ]);
  });

  it('should register a listener for the Webpack plugin', () => {
    // Given
    const events = {
      on: jest.fn(),
    };
    const app = {
      get: jest.fn(() => events),
    };
    let sut = null;
    // When
    sut = new WoopackAngularJSPlugin();
    sut.register(app);
    // Then
    expect(app.get).toHaveBeenCalledTimes(1);
    expect(app.get).toHaveBeenCalledWith('events');
    expect(events.on).toHaveBeenCalledTimes(1);
    expect(events.on).toHaveBeenCalledWith(sut.eventName, expect.any(Function));
  });

  it('should update the JS loaders of a browser target', () => {
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
    const currentLoaders = [currentJSLoader];
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
    sut = new WoopackAngularJSPlugin();
    sut.register(app);
    [[, reducer]] = events.on.mock.calls;
    result = reducer(currentLoaders, { target });
    // Then
    expect(result).toEqual(expectedLoaders);
    expect(app.get).toHaveBeenCalledTimes(1);
    expect(app.get).toHaveBeenCalledWith('events');
    expect(events.on).toHaveBeenCalledTimes(1);
    expect(events.on).toHaveBeenCalledWith(sut.eventName, expect.any(Function));
  });

  it('shouldn\'t modify the loaders if the target is not for browser', () => {
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
    const currentLoaders = [{
      test: /\.jsx?$/i,
      use: [
        'some-random-loader',
      ],
    }];
    let sut = null;
    let reducer = null;
    let result = null;
    // When
    sut = new WoopackAngularJSPlugin();
    sut.register(app);
    [[, reducer]] = events.on.mock.calls;
    result = reducer(currentLoaders, { target });
    // Then
    expect(result).toEqual(currentLoaders);
    expect(app.get).toHaveBeenCalledTimes(1);
    expect(app.get).toHaveBeenCalledWith('events');
    expect(events.on).toHaveBeenCalledTimes(1);
    expect(events.on).toHaveBeenCalledWith(sut.eventName, expect.any(Function));
  });

  it('should update the JS loaders of a browser target and add the Babel required features', () => {
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
    const currentLoaders = [currentJSLoader];
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
    sut = new WoopackAngularJSPlugin();
    sut.register(app);
    [[, reducer]] = events.on.mock.calls;
    result = reducer(currentLoaders, { target });
    // Then
    expect(result).toEqual(expectedLoaders);
    expect(app.get).toHaveBeenCalledTimes(1);
    expect(app.get).toHaveBeenCalledWith('events');
    expect(events.on).toHaveBeenCalledTimes(1);
    expect(events.on).toHaveBeenCalledWith(sut.eventName, expect.any(Function));
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
    const currentLoaders = [currentJSLoader];
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
    sut = new WoopackAngularJSPlugin();
    sut.register(app);
    [[, reducer]] = events.on.mock.calls;
    result = reducer(currentLoaders, { target });
    // Then
    expect(result).toEqual(expectedLoaders);
    expect(app.get).toHaveBeenCalledTimes(1);
    expect(app.get).toHaveBeenCalledWith('events');
    expect(events.on).toHaveBeenCalledTimes(1);
    expect(events.on).toHaveBeenCalledWith(sut.eventName, expect.any(Function));
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
    const currentLoaders = [currentJSLoader];
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
    sut = new WoopackAngularJSPlugin();
    sut.register(app);
    [[, reducer]] = events.on.mock.calls;
    result = reducer(currentLoaders, { target });
    // Then
    expect(result).toEqual(expectedLoaders);
    expect(app.get).toHaveBeenCalledTimes(1);
    expect(app.get).toHaveBeenCalledWith('events');
    expect(events.on).toHaveBeenCalledTimes(1);
    expect(events.on).toHaveBeenCalledWith(sut.eventName, expect.any(Function));
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
    const currentLoaders = [currentJSLoader];
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
    sut = new WoopackAngularJSPlugin();
    sut.register(app);
    [[, reducer]] = events.on.mock.calls;
    result = reducer(currentLoaders, { target });
    // Then
    expect(result).toEqual(expectedLoaders);
    expect(app.get).toHaveBeenCalledTimes(1);
    expect(app.get).toHaveBeenCalledWith('events');
    expect(events.on).toHaveBeenCalledTimes(1);
    expect(events.on).toHaveBeenCalledWith(sut.eventName, expect.any(Function));
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
    const currentLoaders = [currentJSLoader];
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
    sut = new WoopackAngularJSPlugin();
    sut.register(app);
    [[, reducer]] = events.on.mock.calls;
    result = reducer(currentLoaders, { target });
    // Then
    expect(result).toEqual(expectedLoaders);
    expect(app.get).toHaveBeenCalledTimes(1);
    expect(app.get).toHaveBeenCalledWith('events');
    expect(events.on).toHaveBeenCalledTimes(1);
    expect(events.on).toHaveBeenCalledWith(sut.eventName, expect.any(Function));
  });
});
