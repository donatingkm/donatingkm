const Router = require('spa-router-better');
const { Module } = require('./core');
const { debug, utils } = require('./sandbox');
const Views = require('./views');
const Components = require('./components');

class Application extends  Module {
  constructor() {
    super({
      name: 'App',
      type: 'application',
    });
    this.views = {};
    this.components = {};
    this.routes = {
      '/donatingkm/www/test.html': this.rootView.bind(this),
    };
    this.router = new Router(this.routes);
  }

  rootView(req) {
    debug.log('RootView is loaded', req);
    App.view('root').start({ test: 'Hello world'});
  }

  listenEvents(){
    super.listenEvents();

  }

  view(name) {
    const nameView = `${utils.capitalize(name)}View`;
    if(!this.views[nameView]) {
      this.views[nameView] = new Views[nameView]();
    }
    return this.views[nameView];
  }

  component(name) {
    const instanceName = name.split(':')[0];
    const className = utils.capitalize(name.split(':')[1]);
    if(!this.components[instanceName]) {
      this.components[instanceName] = new Components[`${className}Component`]({ id: instanceName });
    }

    return this.components[instanceName];
  }


  go(pathView) {
    this.router.dispatch(pathView);
  }

  start() {
    if(!window.App) {
      window.App = this;
    }
    super.start();
    this.router.start({
      root: '/donatingkm/www/test.html',
      notFound: (req) => debug.log('404 not found', req),
      mode: 'history',
    });
  }
};

const App = new Application();
App.start();





