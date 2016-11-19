
function capitalize(string) {
  return string.replace(/\b\w/g, function(l){ return l.toUpperCase() });
}
function getType(obj) {
  let type = null;

  if (obj === undefined) {
    type = 'Undefined';
  }

  if (obj === null) {
    type = 'Null';
  }

  const typeString = Object.prototype.toString.call(obj);
  type = typeString.slice(typeString.indexOf(' ') + 1, -1);
  return type;
}

module.exports = {
  getType,
  capitalize,
};
