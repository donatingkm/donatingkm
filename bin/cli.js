#!/usr/bin/env node

/**
 * Dependencies from node_modules directory
 */
const Runner = require('undertaker');
const program = require('commander');

/**
 * Dependencies from utils directory
 */
const { debug } = require('./utils');

/**
 * Dependencies from tasks directory
 */
const TaskBuild = require('./tasks/task-build');

/**
 * UZ CLI
 * @class Cli
 * @example By command line: cli [command] [options]
 * @example By Javascript API: cli.[command]([options])
 */
class Cli {
  constructor() {
    this.options = {};
    this.program = program;
    this.runner = new Runner();
    this.commands = {};

    this.catchErr();
    this.registerTasks();
    this.registerCommands();
  }

  /**
  * Catch errors on application process
  * @private
  */
  catchErr() {
    process.on('uncaughtException', (err) => {
      debug.log(`Caught exception: ${err.stack}`);
    });
  }

 /**
  * Register process task for WebExtensions
  * @private
  */
  registerTasks() {
    const runner = this.runner;

    runner.task('build', () => {
      const options = this.commands.build.options || {};
      const taskBuild = new TaskBuild(options);
    });

    runner.task('deploy', () => {
      const options = this.commands.deploy.options || {};
      console.log('Deploy ', options);
    });
  }

 /**
  * This private method registers CLI commands for cli
  * @private
  */
  registerCommands() {
    const Program = this.program;

    Program
      .version('1.0.0 (beta)');

    Program
      .command('build')
      .description('Description for command build')
      .action(this.buildHandler.bind(this));

    Program
      .command('deploy')
      .description('Description for command deploy')
      .option('-b, --browser <name>', 'Description for browser option')
      .action(this.deployHandler.bind(this));

    Program.parse(process.argv);
  }

 /**
  * This private method allows save command options
  * @param1 {string} path property or object name
  * @param2 {objetc} json object with command options for command
  * @private
  */
  setCommandOptions(cmd, commandOptions) {
    this.commands[cmd] = {
      options: commandOptions,
    };
  }

 /**
  * Public method allows run the task with command options
  * @param1 {string} command name
  * @param2 {object} json object with command options for command
  * @public
  *
  * @example uz.run('build', { browser: ["chrome","firefox","edge" ]})
  */
  run(argTaskName, argCommandOptions) {
    const taskName = argTaskName;
    const commandOptions = argCommandOptions;

   console.log('====================================');
   console.log('|| RUN TASK ' + taskName.toUpperCase() + '                 ||');
   console.log('====================================');

    if (commandOptions) {
      this.setCommandOptions(taskName, commandOptions);
    }
    this.runner.task(taskName).apply(this);
  }

 /**
  * This private method extract command options from arguments of commanderjs
  * @param1 {array} arguments of commanderj
  * @return {object} json object with command options for command
  * @private
  */
  getCommandOptions(args) {
    const options = [];

    for (const item in args.options) {
      const name = args.options[item].long.replace('--', '');
      const jsonData = {};
      jsonData[name] = args[name];
      options.push(jsonData);
    }
    return options;
  }

 /**
  * Private method that it is the handler manages the response from comanderjs for build command
  * @param1 {array} arguments from cammanderjs
  * @private
  */
  buildHandler(args) {
    const commandOpts = this.getCommandOptions(args);
    this.run('build', commandOpts);
  }

 /**
  * Private method that it is the handler manages the response from comanderjs for deploy command
  * @param1 {array} arguments from cammanderjs
  * @private
  */
  deployHandler(args) {
    const commandOpts = this.getCommandOptions(args);
    this.run('build', commandOpts);
  }

 /**
  * Build command
  * @param1 {object} json object with command options for command
  * @public
  * @example dkm.build({ "browser" : ["chrome", "firefox", "edge"] })
  */
  build(commandOpts) {
    this.run('build', commandOpts);
  }

 /**
  * Deploy command
  * @param1 {object} json object with command options for command
  * @public
  * @example dkm.build({ "browser" : ["chrome", "firefox", "edge"] })
  */
  deploy(options) {
    this.run('deploy', options);
  }
}

module.exports = new Cli();
