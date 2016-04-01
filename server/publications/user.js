// Publish user's info we need
Meteor.publish(null, function () {
    return Meteor.users.find({
      _id: this.userId,
    }, {
      // We just publish this subset of their data
      fields: {
        'subscription': 1,
        'customerId': 1
      }
    });
  });