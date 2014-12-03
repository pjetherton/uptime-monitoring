/* Copyright (c) 2014 Paul Etherton
 */

Meteor.startup(function () {
  URLs.allow({
    insert: function (userId, url) {
      return userId ? true : false;
    },

    remove: function(userId, url) {
      return userId ? true : false;
    }
  });
});
