const { View } = require('./../../core');
const { debug } = require('./../../sandbox');

class RootView extends View {
  constructor() {
    super({
      name: 'indexPage',
      container: 'DKM',
    });
  }

  start(args) {
    super.start(args);
    debug.log('Index page is started');
    App.component('test:list').setup({
      container: this.$container,
    });
    App.component('test:list').start();
  }
}

module.exports = RootView;
