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
 * @file    read-directory.js
 * @author  UserZoom R&D
 * @email   rd@userzoom.com
 * @date    2016-03-11
 * @summary Read Directory utils
 */

/**
 * Dependencies from API node
 */
const fs = require("fs")
const { isFunction } = require('util')
const path = require('path')

 /**
  * Allows read the content of directories
  * @param {string} path_name 
  * @param {object} options json object of options to read process
  * @public
  *
  * @example
  *
  * util.read_dir(dir_content_scripts, {
  *                ext: '.js',
  *                onReadFile: function(file){ // callabck },
  *                onReadDirectory: function(dir){ // callback }
  *                })
  * 
  */
function read_dir(path_name, options){

    const p = pathName
    const ext = !options.onReadFile ? '.__' : (options.ext || '.js')
    var count = 0

    fs.readdir(p, function (err, files) {
        if (err) {
            if(isFunction(options.onError)){
              options.onError.call(this, err);
            }else{
              throw err;
            }
            process.exit();
        }

        files.map(function (file) {
            return path.join(p, file);
        }).filter(function (file) {
            return (fs.statSync(file).isFile() && path.extname(file)===ext) || fs.statSync(file).isDirectory();
        }).forEach(function (file, index, _files) {
            count = _files.length
            //console.log("file", file)
            //console.log("%s (%s)", file, path.extname(file));
            isFunction(options.onReadFile) && fs.statSync(file).isFile() && options.onReadFile.call(this, file, path.basename(file), count);
            isFunction(options.onReadDirectory) && fs.statSync(file).isDirectory() && options.onReadDirectory.call(this, file, path.basename(file), count);
        });
    });
}


module.exports = read_dir