require('template7/dist/template7.min.js');
const Module = require('./module');

class Component extends Module {
  constructor(args) {
    super(args);
    this.id = args.id;
    this.dependencies = [];
    this.oData = {
      current: {},
      previous: {},
    };
    this.hashData = {
      current: {},
      previous: {},
    };
    this.tpl = args.template || null;
    this.containerCache = null;
    this.target = `${args.target}`;
    this.buildCache = null;
    this.mountedCache = null;
    this.refDomCache = null;
    this.targetCache = null;
    this.templateEngine = window.Template7;
    this.componentTemplate = args.componentTemplate || null;
    this.tagName = args.tagName || 'default';
    this.classCss= args.classCss || 'default';
  }

  set mounted(value) {
    this.mountedCache = value;
  }

  get mounted() {
    return this.mountedCache;
  }

  set build(value) {
    this.buildCache = value;
  }

  get build() {
    return this.buildCache;
  }

  set template(value) {
    this.tpl = value;
  }

  get template() {
    return this.tpl;
  }

  set data(value) {
    this.oData = value;
  }

  get data() {
    return this.oData;
  }

  get refDom() {
    return this.refDomCache;
  }

  set refDom(value) {
    this.refDomCache = value;
  }

  get container() {
    return this.containerCache;
  }

  set container(value) {
    this.containerCache = value;
  }


  listenEvents() {
    this.listenTo({
      onChangeData: () => {
        const data = this.data.current;
        const template = `{{${this.tagName} classCss}}`;
        this.createBuild(data, template);
      },
      onBuild: () => {
        const build = this.build;
        const target = this.target;
        this.mount(build, target);
      },
      onMount: () => {
        const mounted = this.mounted;
        this.renderDependencies(mounted);
      },
      onRenderDependencies: () => {
        const cointainer = this.container || document;
        const target =  this.targetCache;
        const mounted = this.mounted;
        this.insertDom(target, mounted);
      },
    });
  }

  mount(build, target) {
    const cointainer = this.container || document;
    this.targetCache =  this.refDom || this.$(`#${this.target}`, cointainer)[0];
    const type = this.targetCache.nodeName;
    const mounted = document.createElement(type);
    mounted.id = target;
    mounted.innerHTML = build;
    this.mounted = mounted;
    this.emit(`${this.id}:onMount`, {
      data: this.data,
      template: this.template,
      build: this.build,
      mounted: this.mounted,
    });
  }

  insertDom(target, mounted) {
    const targetElement = target;
    targetElement.parentNode.replaceChild(mounted, targetElement);
    this.refDom = mounted;
    this.emit(`${this.id}:onRender`, {
      id: `${this.id}:${this.tagName}`,
    });
  }

  setup(options) {

    if(options.target){
      this.target = options.target;
    }

    if(options.id){
      this.id = options.id;
    }

    if(options.name){
      this.name = options.name;
    }

    if(options.template) {
      this.template = options.template;
    }

    if(options.refDom) {
      this.refDom = options.refDom;
    }

    if(options.data) {
      this.setData(options.data);
    }

    if(options.container) {
      this.container = options.container;
    }
  }

  createBuild(newData, newTemplate) {
    const template = newTemplate || this.template;
    const data = newData || this.data.current;
    this.build = this.compile(template, data);
    this.emit(`${this.id}:onBuild`, {
      data: this.data,
      template: this.template,
      build: this.build
    });
  }

  registerTags() {
    const templateEngine = this.templateEngine;
    templateEngine.registerHelper(`${this.tagName}`, this.componentTemplate.bind(this));
  }

  compile(template, data) {
    const templateEngine = this.templateEngine;
    this.registerTags();
    const compiledTemplate = templateEngine.compile(template);
    return compiledTemplate(data);
  }

  hashCode(string) {
    let hash = 0, i, chr;
    const len = string.length;
    if (string.length === 0) return hash;
    for (i = 0; i < len; i++) {
      chr = string.charCodeAt(i);
      hash = ((hash << 5) - hash) + chr;
      hash |= 0; // Convert to 32bit integer
    }
    return hash;
  }

  hasChangeData(newData, forceToChange) {
    const newHashData = this.hashCode(JSON.stringify(newData));
    let hasChanged = false;
    if (forceToChange || newHashData !== this.hashData.current) {
      this.hashData.previous = this.hashData.current;
      this.hashData.current = newHashData;
      hasChanged = true;
    }
    return hasChanged;
  }

  setData(newData, forceToChange = false) {
    if(this.hasChangeData(newData, forceToChange)){
      this.data.previous = this.data.current;
      this.data.current = Object.assign(this.data.current, newData);
      this.emit(`${this.id}:onChangeData`, {
        data: this.data
      });
    }
  }

  renderDependencies(mounted) {
    const targetDependencies = this.dependencies;
    const length = targetDependencies.length;
    let counter = 0;
    let i = 0;
    for(; length > i; i++){
      const instanceName = targetDependencies[i].split(':')[0];
      const className = targetDependencies[i].split(':')[1];
      App.component(targetDependencies[i]).setup({ id: instanceName, target: instanceName, container: mounted });
      App.component(targetDependencies[i]).listenEvents();
      App.component(targetDependencies[i]).listenTo({
        onRender: (event) => {
          const id = event.detail.id;
          if ((length -1) === counter) {
            this.emit(`${this.id}:onRenderDependencies`);
          } else {
            counter++;
          }
        }
      }, instanceName);

      App.component(targetDependencies[i]).render(this.data);
    }

    if(length === 0) {
      this.emit(`${this.id}:onRenderDependencies`);
    }
  }

  render(newData, force = false) {
    const data = newData || this.data;
    this.setData(data, force);
  }
}

module.exports = Component;
