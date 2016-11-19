'use strict'

/**
 * @license Copyright (c) UserZoom 2016. All Rights Reserved. http://www.userzoom.com/
 *
 * Proprietary and confidential
 *
 * NOTICE: All information contained herein is, and remains the property
 * of UserZoom Technologies SL. The intellectual and technical concepts
 * contained herein are proprietary to UserZoom Technologies SL and
 * may be covered by U.S. and Foreign Patents, patents in process, and are
 * protected by trade secret or copyright law. Dissemination of this
 * information or reproduction of this material is strictly forbidden unless
 * prior written permission is obtained from UserZoom Technologies SL.
 *
 * @company UserZoom Technologies SL
 * @file    log.js
 * @author  UserZoom R&D
 * @email   rd@userzoom.com
 * @date    2016-03-11
 * @summary Log utils
 */

/**
 * Dependencies from node_modules directory
 */
const chalk  = require('chalk');
const moment = require('moment');

/**
 * Dependencies from API node
 */
const path = require("path");


/**
 * Allow to show messages
 * @param {string} msg body of message
 * @param {string} color define the ouput color of message in console
 * @public
 *
 * @example log("Hello World!!", "white")
 */

class Debug {
  constructor() {
    this.colors = {
      'time': 'white',
      'log': 'white',
      'error': 'red',
      'info': 'blue',
      'warn': 'yellow',
      'time': 'blue'
    };
    return this.applyMethods();
  }

  applyMethods(){
    const self = this;
    let debug = this;
    let color = '';
    for (let method in console) {
      debug[method] = function() {
        const args = Array.prototype.slice.call(arguments);
        const color = self.colors[method];
        const prefix = chalk.bold[color](`[${moment().format('HH:mm:ss')}]`);
        for (let arg in args) {
          if (typeof args[arg] === 'string') {
            args[arg] = chalk.bold[color](args[arg]);
          }
        }
        const message = [prefix].concat(args);
        console[method].apply(console, message);
      };
    }
    return debug;
  }


}

const debug = new Debug();

module.exports = debug;