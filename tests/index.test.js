jest.unmock('/src/index');

require('jasmine-expect');

const ProjextAngularJSPlugin = require('/src/plugin');
const plugin = require('/src/index');

describe('plugin:projextAngularJS', () => {
  it('should call the `register` method of the plugin main class', () => {
    // Given
    const app = 'projextApp';
    // When
    plugin(app);
    // Then
    expect(ProjextAngularJSPlugin).toHaveBeenCalledTimes(1);
    expect(ProjextAngularJSPlugin.mock.instances.length).toBe(1);
    expect(ProjextAngularJSPlugin.mock.instances[0].register).toHaveBeenCalledTimes(1);
    expect(ProjextAngularJSPlugin.mock.instances[0].register).toHaveBeenCalledWith(app);
  });
});
