/* Copyright (c) 2014 Paul Etherton
 */

Meteor.publish("urls", function () {
  if (this.userId) {
    return URLs.find();
  }
});

Meteor.publish("polls", function () {
  if (this.userId) {
    return Polls.find({
      start: {$gte: new Date(new Date() - (1000 * 60 * 60))}
    });
  }
});

Meteor.publish("downtime", function () {
  if (this.userId) {
    return Downtime.find();
  }
});
