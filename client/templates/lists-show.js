var EDITING_KEY = 'editingList';
Session.setDefault(EDITING_KEY, false);

// Track if this is the first time the list template is rendered
var firstRender = true;
var listRenderHold = LaunchScreen.hold();
listFadeInHold = null;

Template.dropsShow.onRendered(function() {
  if (firstRender) {
    // Released in app-body.js
    listFadeInHold = LaunchScreen.hold();

    // Handle for launch screen defined in app-body.js
    listRenderHold.release();

    firstRender = false;
  }

  this.find('.js-title-nav')._uihooks = {
    insertElement: function(node, next) {
      $(node)
        .hide()
        .insertBefore(next)
        .fadeIn();
    },
    removeElement: function(node) {
      $(node).fadeOut(function() {
        this.remove();
      });
    }
  };
});

Template.dropsShow.helpers({
  editing: function() {
    return Session.get(EDITING_KEY);
  },

  todosReady: function() {
    return Router.current().todosHandle.ready();
  },

  todos: function(dropId) {
    return Droplogs.find({dropId: dropId}, {sort: {createdAt : -1}});
  }
});

var editList = function(drop, template) {
  Session.set(EDITING_KEY, true);
  
  // force the template to redraw based on the reactive change
  Tracker.flush();
  template.$('.js-edit-form input[type=text]').focus();
};

var saveList = function(drop, template) {
  Session.set(EDITING_KEY, false);
  Drops.update(drop._id, {$set: {name: template.$('[name=name]').val()}});
}

var deleteList = function(drop) {
  // ensure the last public list cannot be deleted.
  if (! drops.userId && Drops.find({userId: {$exists: false}}).count() === 1) {
    return alert("Sorry, you cannot delete the final public list!");
  }
  
  var message = "Are you sure you want to delete the list " + drop.name + "?";
  if (confirm(message)) {
    // we must remove each item individually from the client
    Droplogs.find({dropId: drop._id}).forEach(function(droplog) {
      Droplogs.remove(droplog._id);
    });
    Drops.remove(drop._id);

    Router.go('home');
    return true;
  } else {
    return false;
  }
};

var toggleListPrivacy = function(drop) {
  if (! Meteor.user()) {
    return alert("Please sign in or create an account to make private lists.");
  }

  if (drop.userId) {
    Drops.update(drop._id, {$unset: {userId: true}});
  } else {
    // ensure the last public list cannot be made private
    if (Drops.find({userId: {$exists: false}}).count() === 1) {
      return alert("Sorry, you cannot make the final public list private!");
    }

    Drops.update(drop._id, {$set: {userId: Meteor.userId()}});
  }
};

Template.dropsShow.events({
  'click .js-cancel': function() {
    Session.set(EDITING_KEY, false);
  },
  
  'keydown input[type=text]': function(event) {
    // ESC
    if (27 === event.which) {
      event.preventDefault();
      $(event.target).blur();
    }
  },
  
  'blur input[type=text]': function(event, template) {
    // if we are still editing (we haven't just clicked the cancel button)
    if (Session.get(EDITING_KEY))
      saveList(this, template);
  },

  'submit .js-edit-form': function(event, template) {
    event.preventDefault();
    saveList(this, template);
  },
  
  // handle mousedown otherwise the blur handler above will swallow the click
  // on iOS, we still require the click event so handle both
  'mousedown .js-cancel, click .js-cancel': function(event) {
    event.preventDefault();
    Session.set(EDITING_KEY, false);
  },

  'change .list-edit': function(event, template) {
    if ($(event.target).val() === 'edit') {
      editList(this, template);
    } else if ($(event.target).val() === 'delete') {
      deleteList(this, template);
    } else {
      toggleListPrivacy(this, template);
    }

    event.target.selectedIndex = 0;
  },
  
  'click .js-edit-list': function(event, template) {
    editList(this, template);
  },
  
  'click .js-toggle-list-privacy': function(event, template) {
    toggleListPrivacy(this, template);
  },
  
  'click .js-delete-list': function(event, template) {
    deleteList(this, template);
  },
  
  'click .js-todo-add': function(event, template) {
    template.$('.js-todo-new input').focus();
  },

  'submit .js-todo-new': function(event) {
    event.preventDefault();

    var $input = $(event.target).find('[type=text]');
    if (! $input.val())
      return;
    
    Droplogs.insert({
      dropId: this._id,
      text: $input.val(),
      checked: false,
      createdAt: new Date()
    });
    Drops.update(this._id, {$inc: {incompleteCount: 1}});
    $input.val('');
  }
});
