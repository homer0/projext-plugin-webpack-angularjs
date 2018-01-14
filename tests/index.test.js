jest.unmock('/src/index');

require('jasmine-expect');

const WoopackAngularJSPlugin = require('/src/plugin');
const plugin = require('/src/index');

describe('plugin:woopackAngularJS', () => {
  it('should call the `register` method of the plugin main class', () => {
    // Given
    const app = 'woopackApp';
    // When
    plugin(app);
    // Then
    expect(WoopackAngularJSPlugin).toHaveBeenCalledTimes(1);
    expect(WoopackAngularJSPlugin.mock.instances.length).toBe(1);
    expect(WoopackAngularJSPlugin.mock.instances[0].register).toHaveBeenCalledTimes(1);
    expect(WoopackAngularJSPlugin.mock.instances[0].register).toHaveBeenCalledWith(app);
  });
});
