/**
 * Dependencies from node API
 */
const path = require('path');

/**
 * Dependencies from utils directory
 */
const Task = require('./task-base');
const { debug, browserify } = require('../utils');

/**
 * This class allows instances to build process
 * @class Build
 * @param {object} args is a object json of options
 * @return -
 *
 * @example new Build({ browser: "chrome,firefox,edge" })
 */
class Build extends Task {

 /**
  * Allow register task in the build process
  * @param -
  * @private
  *
  * @example  runner.task('<task_name>', <handler> )
  *
  */
  registerTask() {
    const run = this.runner;
    run.task('build-js', this.buildJs);
  }

 /**
  * Process to create the bundle background for webextensions
  * @param -
  * @private
  */
  buildJs() {
    const sourcePath = path.resolve(__dirname, '../../src/index.js');
    const bundlePath = path.resolve(__dirname, './../../www/js/app.js');

    this.createBundle('Build', sourcePath, bundlePath, (bundleInfo) => {
      const info = bundleInfo;
      const msg = `1) The app bundle was created successful in the follow path: ${bundlePath}`;
      debug.info(msg);
    });
  }

 /**
  * Allows use the face of browserify utils
  * @param {string} source start point for browserify
  * @param {string} bundle_path end point for browserify
  * @param {string} msg message that shows at the end of process
  * @private
  */
  createBundle(taskName, source, bundlePath, callback) {

    browserify
      .task(taskName)
      .entry(source)
      .output(bundlePath)
      .options({
        entry: true,
        debug: true,
        unbom: true,
        unshebang: true,
        dedupe: true,
      })
      .run(() => {
        callback.call(this);
      });
 }

 /**
  * Allows run the task of build process
  * @param -
  * @public
  */
  job() {
    this.runner.task('build-js').call(this);
  }
}

module.exports = Build;
