/*
* Braintree Webhook Functions
* Functions for handling data sent to us from Braintree via webhooks.
*/

btUpdateSubscription = function(request){
  // Because Braintree doesn't have our Meteor user's ID, we need to do a quick
  // lookup on our user's collection per the customerId Braintree gives us.
  var transaction = request.transactions;
  var customerId  = transaction[transaction.length-1].customer.id;

  var getUser = Meteor.users.findOne({"customerId": customerId}, {fields: {"_id": 1}});

  if (getUser){
    // Store our update in an object.
    var update = {
      auth: SERVER_AUTH_TOKEN,
      user: getUser._id,
      subscription: {
        status: "Canceled",
        ends: request.billingPeriodEndDate
      }
    }

    // Call to our updateUserSubscription method.
    Meteor.call('updateUserSubscription', update, function(error, response){
      if (error){
        console.log(error);
      }
    });
  }
}

btCreateInvoice = function(request){
  // Because Braintree doesn't have our Meteor user's ID, we need to do a quick
  // lookup on our user's collection per the customerId Braintree gives us.
  var transaction = request.transactions;
  var customerId  = transaction[transaction.length-1].customer.id;

  var getUser = Meteor.users.findOne({"customerId": customerId}, {fields: {"_id": 1, "emails.address": 1}});

  if (getUser){
    // Cache the invoice item from Braintree.
    var invoiceItem = request;
    var trial = request.trialPeriod;

    // Make sure that our invoice doesn't have trial status. We do this because Braintree
    // generates an invoice for our customer's trial (for $0), even though they
    // technically haven't *paid* anything.
    if (trial === false) {
      // Setup an invoice object.
      var invoice = {
        owner: getUser._id,
        email: getUser.emails[0].address,
        date: invoiceItem.billingPeriodStartDate,
        planId: invoiceItem.planId,
        ends: invoiceItem.billingPeriodEndDate,
        amount: invoiceItem.nextBillAmount,
        transactionId: Random.hexString(10)
      }

      // Perform our insert. Note: we're doing this here because we'll only ever
      // add invoices via this function. Since we're not sharing it with another
      // operation in the app, we can just isolate it here.
      Invoices.insert(invoice, function(error, response){
        if (error){
          console.log(error);
        }
      });
    }
  }
}
