
const Browserify = require("./browserify")
const read_dir = require("./read-directory")
const debug = require("./debug")


module.exports = {
    debug : debug,
    read_dir : read_dir,
    browserify : new Browserify()
}