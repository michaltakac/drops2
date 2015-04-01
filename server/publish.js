Meteor.publish('publicDroplogs', function() {
  return Drops.find({userId: {$exists: false}});
});

Meteor.publish('privateDroplogs', function() {
  if (this.userId) {
    return Drops.find({userId: this.userId});
  } else {
    this.ready();
  }
});

Meteor.publish('droplogs', function(dropId) {
  check(dropId, String);

  return Droplogs.find({dropId: dropId});
});
