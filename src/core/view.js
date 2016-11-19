const Module = require('./module');
const { debug } = require('./../sandbox');
const Router = require('spa-router-better');

class View extends Module {
  constructor(args) {
    super(args);
    this.container = args.container || '';
    this.$container = null;
    this.routes = args.routes || null;
    if(this.routes !== null) {
      for(let route in this.routes){
        debug.log('route', route, this.routes[route]);
        App.router.on(route, (req) => {
          debug.log('req', req);
          this.routes[req.path](req);
        });
      }
    }
  }

  loadView(pathView) {
    App.router.setRoute(pathView);
  }

  sendRequest() {}

  readResponse() {}

  setup() {

  }

  onShow() {}

  onLoad() {

  }

  onunLoad() {

  }

  start(args) {
    super.start(args);
    this.$container = this.$(`#${this.container}`)[0];
  }
}

module.exports = View;
