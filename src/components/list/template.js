module.exports = function(classCss, options) {
    const className = '' + classCss;
    const posts = options.root.Posts;
    const length = posts.length;
    let items = '';
    for(let i=0; length > i; i++) {
        const itemId = `item-${posts[i].id}`;
        items += `<li><item id="${itemId}"></item></li>`;
        this.dependencies.push(`${itemId}:item`);
    }
    return `<ul class="${className}">${items}</ul>`;
}