# projext plugin for AngularJS on webpack

[![Travis](https://img.shields.io/travis/homer0/projext-plugin-webpack-angularjs.svg?style=flat-square)](https://travis-ci.org/homer0/projext-plugin-webpack-angularjs)
[![Coveralls github](https://img.shields.io/coveralls/github/homer0/projext-plugin-webpack-angularjs.svg?style=flat-square)](https://coveralls.io/github/homer0/projext-plugin-webpack-angularjs?branch=master)
[![David](https://img.shields.io/david/homer0/projext-plugin-webpack-angularjs.svg?style=flat-square)](https://david-dm.org/homer0/projext-plugin-webpack-angularjs)
[![David](https://img.shields.io/david/dev/homer0/projext-plugin-webpack-angularjs.svg?style=flat-square)](https://david-dm.org/homer0/projext-plugin-webpack-angularjs)

Allows you to bundle an [AngularJS](https://angularjs.org) project with [projext](https://yarnpkg.com/en/package/projext) using the [webpack](https://webpack.js.org) [build engine](https://yarnpkg.com/en/package/projext-plugin-webpack).

## Introduction

[projext](https://yarnpkg.com/en/package/projext) allows you to configure a project without adding specific settings for a module bundler, then you can decide which build engine to use. This plugin is meant to be used when you are bundling an [AngularJS](https://angularjs.org) application and you are using the [webpack](https://webpack.js.org) [build engine](https://yarnpkg.com/en/package/projext-plugin-webpack).

It adds the [`angularjs-annotate`](https://yarnpkg.com/en/package/babel-plugin-angularjs-annotate) plugin to the [Babel](https://babeljs.io) configuration in order to support AngularJS annotations.

Now you can use the `ngInject` directive on your code to inject your dependencies

```js
class MyService {
  constructor($http, $q) {
    'ngInject';

    this.$http = $http;
    this.$q = $q;
    ...
  }
  ...
}
```

## Information

| -            | -                                                                                      |
|--------------|----------------------------------------------------------------------------------------|
| Package      | projext-plugin-webpack-angularjs                                                       |
| Description  | Allows you to bundle an AngularJS project with projext using the webpack build engine. |
| Node Version | >= v8.0.0                                                                             |

## Usage

1. You first need the build engine, so install [`projext-plugin-webpack`](https://yarnpkg.com/en/package/projext-plugin-webpack).
2. Add a new setting to your target named `framework` and set its value to `angularjs`.
3. Done

Now, when your target gets builded, the plugin will check if the target is using webpack and if the framework is AngularJS, then it will add the required loader and configure the transpilation options.

### Babel

The [`babel-plugin-angularjs-annotate`](https://yarnpkg.com/en/package/babel-plugin-angularjs-annotate) package only works on `function` statements, that's why it needs to update the configuration of the [`@babel/preset-env`](https://yarnpkg.com/en/package/@babel/preset-env) in order to work.

Let's say you are only supporting the last version of major browsers, well, most of them already support arrow functions and by default they wouldn't be transpiled.

If for some reason you are overwriting the [Babel](https://babeljs.io) configuration projext generates, you need to make sure the following transformations are included:

- `@babel/plugin-transform-arrow-functions`
- `@babel/plugin-transform-classes`
- `@babel/plugin-transform-parameters`

### External dependencies

When bundling your targets, the plugin will check if the target is for Node or if it is a browser library and automatically exclude the AngularJS package so it doesn't end up on your build.

### Default HTML

If you didn't create an HTML file for your AngularJS app, projext will create one for you and this plugin will take care of updating the contents of that HTML so you can run your app right away.

Now, there are a few options you can change in order to customize the way the HTML is generated: You can create a `frameworkOptions` property on your target configuration and set the following values:

```js
{
  frameworkOptions: {
    title: null,
    appName: null,
    strict: true,
    cloak: true,
    useBody: true,
    mainComponent: 'main',
  }
}
```

- `title`: A custom title for the HTML file. By default, projext, uses the name of the target.
- `appName`: A custom name of the [`ng-app` attribute](https://docs.angularjs.org/api/ng/directive/ngApp). By default, the plugin will convert te target name to `lowerCamelCase` and use that.
- `strict`: Whether or not you want to use the [`ng-strict-di` directive](https://docs.angularjs.org/api/ng/directive/ngApp#with-ngstrictdi-).
- `cloak`: Whether or not you want to use the [`ng-cloak` directive](https://docs.angularjs.org/api/ng/directive/ngCloak).
- `useBody`: Whether to add the `ng-app` attribute and the directives on the `<body />` or on a `<div />` inside it.
- `mainComponent`: The tag name of a component that should be inside the _"app tag"_.

## Development

### Yarn/NPM Tasks

| Task                    | Description                         |
|-------------------------|-------------------------------------|
| `yarn test`             | Run the project unit tests.         |
| `yarn run lint`         | Lint the modified files.            |
| `yarn run lint:full`    | Lint the project code.              |
| `yarn run docs`         | Generate the project documentation. |

### Testing

I use [Jest](https://facebook.github.io/jest/) with [Jest-Ex](https://yarnpkg.com/en/package/jest-ex) to test the project. The configuration file is on `./.jestrc`, the tests and mocks are on `./tests` and the script that runs it is on `./utils/scripts/test`.

### Linting

I use [ESlint](http://eslint.org) to validate all our JS code. The configuration file for the project code is on `./.eslintrc` and for the tests on `./tests/.eslintrc` (which inherits from the one on the root), there's also an `./.eslintignore` to ignore some files on the process, and the script that runs it is on `./utils/scripts/lint`.

### Documentation

I use [ESDoc](http://esdoc.org) to generate HTML documentation for the project. The configuration file is on `./.esdocrc` and the script that runs it is on `./utils/scripts/docs`.
