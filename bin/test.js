
var ProgressBar = require('cli-progress-bar');
var bar = new ProgressBar();
var total = 0;
var timer = setInterval(function () {
    bar.show('Test', total/100);
    if (total >= 100) {
        bar.hide();
        clearInterval(timer);
    }else{
        total ++;
    }
}, 100);

var chalk = require('chalk');
var Log = require('log');
var log = new Lognpm uninstal();

// style a string
log.debug(chalk.blue('Hello world!'));

// combine styled and normal strings
chalk.blue('Hello') + 'World' + chalk.red('!');

// compose multiple styles using the chainable API
log.info(chalk.blue.bgRed.bold('Hello world!'));

// pass in multiple arguments
log.critical(chalk.blue('Hello', 'World!', 'Foo', 'bar', 'biz', 'baz'));

// nest styles
chalk.red('Hello', chalk.underline.bgBlue('world') + '!');

// nest styles of the same type even (color, underline, background)
chalk.green(
    'I am a green line ' +
    chalk.blue.underline.bold('with a blue substring') +
    ' that becomes green again!'
);



