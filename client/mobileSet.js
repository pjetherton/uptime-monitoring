/* Copyright (c) 2014 Paul Etherton
 */

Template.mobileSet.events({
  'submit form': function (event, template) {
    event.preventDefault();

    if (!Meteor.user()) {
      return;
    }

    Meteor.call('setMobile', event.target.mobile.value, function (error, result) {
      if (error) {
        alert("Your mobile number was not set due to an error: " + error);
      } else if (!result) {
        alert(
          "Your mobile number was not set.\n" +
          "Either you are not logged in or validation failed.\n" +
          "Format must be international with no spaces."
        );
      } else {
        alert("Your mobile number was updated successfully.");
      }
    });
  }
});
