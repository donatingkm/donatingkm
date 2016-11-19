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
 * @file    lazaruz.js
 * @author  UserZoom R&D
 * @email   rd@userzoom.com
 * @date    2016-03-11
 * @summary LazarUZ utils
 */


const Browserify = require("./browserify")
const read_dir = require("./read-directory")
const debug = require("./debug")


module.exports = {
    debug : debug,
    read_dir : read_dir,
    browserify : new Browserify()
}