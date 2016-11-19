const { Component } = require('../../core');
const { Posts } = require('../../mocks');
const Template = require('./template');

class ListComponent extends Component {
  constructor() {
    super({
      id: 'list',
      name: 'List',
      tagName: 'list',
      type: 'component',
      classCss: 'list-items',
      target: 'list',
      componentTemplate: Template,
    });
  }

  start() {
    super.start();
    this.render({
      classCss: 'css-list',
      Posts,
    });
  }
}

module.exports = ListComponent;