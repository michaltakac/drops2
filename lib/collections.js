Drops = new Mongo.Collection('drops');

// Calculate a default name for a list in the form of 'List A'
Drops.defaultName = function() {
  var nextLetter = 'A', nextName = 'Droplog ' + nextLetter;
  while (Drops.findOne({name: nextName})) {
    // not going to be too smart here, can go past Z
    nextLetter = String.fromCharCode(nextLetter.charCodeAt(0) + 1);
    nextName = 'Droplog ' + nextLetter;
  }

  return nextName;
};

Droplogs = new Mongo.Collection('droplogs');
