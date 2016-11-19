/**
 * Dependencies from node_modules directory
 */
const Browserify = require('browserify');
const babelify = require('babelify');
const eslintify = require('eslintify');
const html = require('html-browserify');
const css = require('browserify-css');
const debug = require('./debug.js');
const ProgressBar = require('cli-progress-bar');
const bar = new ProgressBar();

/**
 * Dependencies from API node
 */
const fs   = require('fs');
const path = require('path');
const { isFunction } = require('util');

/**
 * UZ CLI
 * @class Task_Browserify
 * @param -
 * @return -
 *
 * @example
 *
 * const browserify  = new Task_Browserify()
 *
 *        browserify.entry(source)
 *                  .output(bundle_path)
 *                  .onBundle(function(){
 *                     // callback
 *                   return this
 *                  })
 *                 .options({
 *                   entry: true,
 *                   debug: true
 *                  })
 *                 .run()
 *
 */
class TaskBrowserify {

constructor() {
      this.taskName = '';
      this.opts = {};
      this.bundlePath = '';
      this.source = [];
      this.callbackError = null;
      this.browserify = Browserify;
   }

   task(name) {
      this.taskName = name;
     return this;
   }

   /**
    * Allows set the opts to browserify
    * @param {object} opts json object properties
    * @public
    */
   options(opts) {
      Object.assign(this.opts, opts);
      return this;
   }

   /**
    * Allows set the start point for Browserify
    * @param {string} source path of file
    * @public
    */
   entry(source) {
      this.source.push(source);
      return this;
   }

   /**
    * Allows set directory where the bundle will be created
    * @param {string} bundle_path
    * @public
    */
   output(bundlePath) {
      this.bundlePath = bundlePath;
      return this;
   }

   /**
    * Check if the path is a directory
    * @param {string} dir path to check
    * @private
    */
   isExistDirectory(dir) {
      if (!fs.existsSync(path.dirname(dir))) {
         fs.mkdirSync(path.dirname(dir));
      }
      return dir;
   }

  isExistFile(file, callback) {
     return fs.readFile(file, callback);
   }


   preRun(opt, callback) {
     const b = this.browserify(opt.options);
     let count = 0;


     b.on('file', (file, id, parent) => { count++; })
      .add(opt.source)
      .transform(html)
      .transform(css, {})
      .bundle()
      .on('error', function(err) {
        debug.error(`Error: ${err.message} - ${err.stack}`);
        process.exit();
      })
      .pipe(opt.bundleFS)
      .on('finish', () => {
        fs.unlink(this.bundlePath, () => {
          if (isFunction(callback)) {
            callback.call(this, count);
          }
        });
       });
   }

   compile(callback) {
    const bundlePath = this.bundlePath;
    const source = this.source;
    const bundleFS = fs.createWriteStream(this.isExistDirectory(bundlePath));
    const options = this.opts;
    const totalFiles = this.preRun({
      source,
      bundleFS,
      options,
      }, (totalFiles) => {
        const percent = 0;
        let files = 0;
        const taskName = this.taskName;
        const getPercent = (files) => ((files * 100)/totalFiles)/100;
        const bundleFSsucces = fs.createWriteStream(this.isExistDirectory(bundlePath));
        const b = this.browserify(options);
        let totalProgress = 0;

        b
        .on('error', function(err) { debug.error(` error: ${err}`); this.emit('end'); })
        .on('file', (file, id, parent)=>{
          files++;
          const percent = getPercent(files);

          if(totalProgress < (percent * 100)) {
            totalProgress = parseInt(percent * 100);
            bar.show(`${taskName} ${totalProgress}% - ${file}`, percent);
          }

        })
        .on('transform', (tr, file) => { /*bar.pulse(` (transform process) ${totalProgress} ${file}`);*/ })
        .add(source)
        .transform(babelify, { presets: ['es2015'] })
        .transform(html)
        .transform(css, {
          rootDir: '.',
          onFlush: function(options, done) {
            if(options.data){
              fs.appendFileSync('www/css/app.css', options.data);
            }
            // Do not embed CSS into a JavaScript bundle
            done(null);
          },
        })
        .bundle()
        .pipe(bundleFSsucces)
        .on('finish', () => {
          bar.hide();
          if (isFunction(callback)) {
            callback.call(this);
          }
        });
    });
   }


   /**
   * Allow to run the browserify process
   * @param {function} callback that launchs when the browserify process is finished.
   * Note: This callback manage the success process and the errors process
   * @public
   */
   run(callback) {
    const pathCss = path.resolve('www/css/app.css');
    this.isExistFile(pathCss, (err, data) => {
      if(!err) {
        fs.unlinkSync(pathCss);
      }
      this.compile(callback);
    });
   }
}

module.exports = TaskBrowserify;
