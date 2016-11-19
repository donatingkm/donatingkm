const Module = require('./module');
const Template7 = require('template7');

class Component extend Module {
  constructor(args) {
    $super(args);
    this.template = '';
    this.data = {
      current: {},
      previous: {}
    };
    this.hashData = {
      current: 0,
      previous: 0
    };
    this. targets = ['body'];
    this.build = null;
    this.refDom = null;
    this.readTemplate();
  }

  setupListeners(){
    this.subscribe('onChangeData', (event) => {
      this.createBuild(event);
    });
    this.subscribe('onBuild', (event) => {
      this.insertToDom(event);
    });
  }

  hashCode(string) {
      let hash = 0, i, chr,;
      const len = string.length;
      if (string.length === 0) return hash;
      for (i = 0; i < len; i++) {
        chr   = string.charCodeAt(i);
        hash  = ((hash << 5) - hash) + chr;
        hash |= 0; // Convert to 32bit integer
      }
      return hash;
  }

  hasChangeData(newData, forceToChange){
    const newHashData = this.hashCode(JSON.stringify(newData);
    let hasChanged = false;
    if (forceToChange || newHashData !== this.hashData) {
      this.hashData.previous = this.hashData.current;
      this.hashData.current = newHashData;
      hasChanged = true;
    }

    return hasChanged;
  }

  setData(newData, forceToChange) {
    if(this.hasChangeData(newData, force)){
      this.data = Object.assign(this.data, newData);
      this.emit('onChangeData');
    }
  }

  convertToDom(string){
    const div = document.createElement('DIV');
    div.innerHTML = string;
    div.id = `tpl-${this.name}`;
    return div;
  }

  getComponentsTags(string) {
    retrun string.replace(/<x-(.|\n)*?>/g);
  }

  getTagName(string){
    const exps = string.match(/<x-([^<]+)\>/);
    return exps[1].split(' ')[0];
  }

  callToBuild(componentName, data, callback) {
    if(App.existComponent(componentName)){
      App.component(componentName).render(data);
    }
  }

  buildDependencies(fn) {
    const tagsDependencies = this.getComponentsTags(this.template);
    const length = tagsDependencies.length;
    const data = this.getData();
    let i=0;
    for(; length > i; i++) {
      let tag = tagsDependencies[i];
      const tagName = this.getTagName(tag);
      this.callToBuild(tagName, data, (event) => {

      });
    }
  }

  createBuild(event) {
    const template = event.template;
    const data = event.data;
    this.buildDependencies(data, (err)=>{
      if(err){

      }
      this.build = this.compile(template, data.current);
      this.emit('onBuild');
    });
  }

  getData() {
    return this.data.current;
  }

  compile(template, data) {
    return Template7
      .compile(template)
      .compiledTemplate(data);
  }

  createEvents() {
    this.createEvent('onChangeData', {
      data: this.data,
      hashData: this.hashData
    });

    this.createEvent('onBuild', {
      data: this.data,
      hashData: this.hashData,
      template: this.template,
      build: this.build
    });

    this.createEvent('onRender', {
      data: this.data,
      hashData: this.hashData,
      template: this.template,
      build: this.build,
      refDom: this.refDom
    });
  }

  setTemplate(template) {
    this.tmp = template;
  }

  getTemplate() {
    return this.tmp;
  }

  readTemplate() {
    const template = this.getTemplate();
    const patternTag = /<x-([\s\S]*?)>/gm;
    let match,
        requires = [];
    while (match = patternTag.exec(template)) {
      requires.push(match[1]);
    }

    this.requires(requires);
  }

  start() {
    $super.start();
    this.render();
  }

  getTargetFromDom(targets, container){
    return this.$(targets, container);
  }

  getBuildDependencies(callback){

  }

  replaceTagComponent(){

  }

  renderTo(event) {
    const build = event.build;

  }

  insertToDom(event) {

  }

  render(newData) {
    const data = newData || this.data;
    this.setData(data, true);
  }
}