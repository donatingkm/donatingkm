const { Component } = require('../../core');
const Template = require('./template');

class ItemComponent extends Component {
  constructor() {
    super({
      name: 'Item',
      tagName: 'item',
      type: 'component',
      componentTemplate: Template,
    });
  }

  start() {
    super.start();
    this.render({
      classCss: 'css-item',
    });
  }
}

module.exports = ItemComponent;
