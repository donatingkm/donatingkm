/**
* Dependencies from node_modules directory
*/
const Runner = require('undertaker');

/**
* Dependencies from node API
*/
const path = require('path');
const fs = require('fs');

/**
 * Dependencies from utils directory
 */
const util = require('../utils');

/**
 * This class allows instances to build process
 * @class Build
 * @param {object} args is a object json of options
 *
 * @example new Build({ browser: "chrome,firefox,edge" })
 */
class Task {
  constructor(args) {
    this.runner = new Runner();
    this.commandsOptions = args;
    this.registerTask();
    this.job();
  }

  /**
  * Allow read the options commands
  * @param {string} option_name
  * @param {obaje} commands_options object json
  * @param {function} callback gives the value of options commands
  * @private
  *
  */
  readOptionsCommands(optionName, callback) {
    const commandsOptions = this.commandsOptions;
    commandsOptions.forEach((item) => {
      let values = '';
      if (item[optionName]) {
        values = item[optionName].split(',');
        values.map((val) => {
          callback.call(this, val);
        });
      }
    });
  }

  /**
  * Allow register task in the build process
  * @param -
  * @private
  *
  * @example  runner.task('<task_name>', <handler> )
  *
  */
  registerTask() { }

  /**
  * Allows run the task of build process
  * @param -
  * @public
  */
  job() {}
}

module.exports = Task;
