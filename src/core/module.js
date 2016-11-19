const Sizzle = require('sizzle');

const { debug, dispatcher } = require('./../sandbox');

class Module {
  constructor(args) {
    this.name = args.name || 'defaultModule';
    this.type = args.type || 'module';
    this.running = false;

    this.config = {
      delay: 0,
      events: {
        onStart: () => {},
        onStop: () => {},
      },
      requires: [],
    };
  }

  setConfig(config) {
    this.config = Object.assign(this.config, config);
  }

  listenEvents(){
    this.listenTo({
      'onStart': this.config.events.onStart,
      'onStop': this.config.events.onStop,
    }, this.id);
  }

  $() {
    return Sizzle.apply(Sizzle, arguments);
  }

  listenTo(events = {}, type = this.id) {
   for(const event in events) {
     const handler = events[event];
     let target = window;
     let eventName = `${type}:${event}`;

     if(type === 'Dom') {
       target = this.$(event.split(':')[0]);
       eventName = event.split(':')[1];
     }

     this.subscribe(target, eventName, handler, false);
   }
  }

  setup(config) {
    this.setConfig(config);
  }

  require(modules = []) {
    modules.map((moduleName, index) => {
      this.reqires.push(moduleName);
      window.addEventListener(`module:${moduleName}`, (event) => {
        const { running, moduleName } = event.detail;
        if(running) {
          let requires = this.requires;
          const posToDelete = requires.indexOf(moduleName);
          requires.slice(posToDelete, requires.length);
          this.requires = requires;
          this.checkRequires();
        }
      });
    });
  }

  fnStart(callback) {
    this.running = true;
    debug.log(`Module(${this.id}) is started`);
    this.emit('onStart');
  }

  checkRequires() {
    const requires = this.config.requires;
    if(requires.length === 0) {
      this.runStart();
    }
  }

  runStart() {
    if(this.config.delay === 0){
      this.fnStart();
    }else{
      setTimeout(() => { this.fnStart(); }, this.config.delay);
    }
  }

  start()
  {
    this.listenEvents();
    this.checkRequires();
  }

  getEventName(eventName) {
    return eventName.indexOf(':') === -1 ? `${this.id}:${eventName}` : eventName;
  }

  stop() {
    this.running = false;
    debug.log(`Module(${this.id}) is stoped`);
    this.emit(`${this.id}:onStop`);
  }

  emit(eventName, args = '') {
    this.createEvent(eventName, args);
    const event = this.getEventName(eventName);
    dispatcher.emit(event);
  }

  createEvent(eventName, details) {
    const event = this.getEventName(eventName);
    dispatcher.createEvent(event, details);
  }

  subscribe(target = window, eventName, handler, bubbling = false) {
    const event = eventName.indexOf(':') === -1 ? `${this.id}:${eventName}` : eventName;
    dispatcher.subscribe(target, event, handler, bubbling);
  }
}

module.exports = Module;