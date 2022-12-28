/**
 * Angular's webpack plugin @angular-devkit/build-angular/src/webpack/plugins/styles-webpack-plugin.js
 * transforms the original webpackOptions.entry point array into a structure like this:
 *
 * ```js
 * {
 *  main: {
 *    import: [...]
 *  },
 *
 *  styles: {
 *    import: [...]
 *  },
 * }
 * ```
 *
 * Storybook throws an __webpack_require__.nmd is not a function error, when another runtime bundle (styles~runtime.iframe.bundle.js) is loaded.
 * To prevent this error, we have to normalize the entry point to only generate one runtime bundle (main~runtime.iframe.bundle.js).
 */
export default class StorybookNormalizeAngularEntryPlugin {
    constructor(options: any);
    options: any;
    apply(compiler: any): void;
    compilation: any;
}
