class Dispatcher {
  constructor() {
    this.__events__ = {};
  }

  emit(eventName) {
    window.dispatchEvent(this.__events__[`${eventName}`]);
  }

  createEvent(eventName, detail) {
    this.__events__[eventName] = new CustomEvent(`${eventName}`, {
      detail,
    });
  }

  subscribe(target = window, eventName, handler, bubling = false) {
    target.addEventListener(eventName, handler, bubling);
  }
}

module.exports = new Dispatcher();