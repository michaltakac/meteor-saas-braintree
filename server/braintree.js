/*
* Methods: Braintree
* Methods for interacting with the Braintree API. Because we'll interact with the
* Braintree API in a number of different ways, we want to break up the various
* functions into multiple methods. This will allow us to define each function
* once, while reusing them multiple times in our application. Sweet!
*/

var gateway;

Meteor.startup(function () {
  // Setting up Braintree
  var braintree = Meteor.npmRequire('braintree');
  gateway = braintree.connect({
    environment: braintree.Environment.Sandbox,
    publicKey: Meteor.settings.public.braintree.BT_PUBLIC_KEY,
    privateKey: Meteor.settings.private.braintree.BT_PRIVATE_KEY,
    merchantId: Meteor.settings.public.braintree.BT_MERCHANT_ID
  });
});

var Future = Npm.require('fibers/future');
var Fiber  = Npm.require('fibers');

Meteor.methods({

  btCreateCustomer: function(card, email, name){
    // Check our arguments against their expected patterns. This is especially
    // important here because we're dealing with sensitive customer information.
    check(card, {
      number: String,
      cvv: String,
      expirationMonth: String,
      expirationYear: String,
      billingAddress: {
        postalCode: String
      }
    });

    check(email, String);
    check(name, String);

    var customerRequest = {
      firstName: name,
      email: email,
      creditCard: card
    };

    // Because Braintree's API is asynchronous (meaning it doesn't block our function
    // from running once it's started), we need to make use of the Fibers/Future
    // library. This allows us to create a return object that "waits" for us to
    // return a value to it.
    var btCustomer = new Future();

    // If all is well, call to the Braintree API to create our customer!
    gateway.customer.create(customerRequest, function(error, result){
      if (error){
        btCustomer.return(error);
      } else {
        btCustomer.return(result);
      }
    });

    return btCustomer.wait();
  },

  btFindCustomer: function(customerId) {
    // Check our arguments against their expected patterns. This is especially
    // important here because we're dealing with sensitive customer information.
    check(customerId, String);

    // Because Braintree's API is asynchronous (meaning it doesn't block our function
    // from running once it's started), we need to make use of the Fibers/Future
    // library. This allows us to create a return object that "waits" for us to
    // return a value to it.
    var btCustomer = new Future();

    // If all is well, call to the Braintree API to find our customer!
    gateway.customer.find(customerId, function(error, result) {
      if (error) {
        btCustomer.return(error);
      } else {
        btCustomer.return(result);
      }
    });

    return btCustomer.wait();
  },

  btCreateSubscription: function(customerId, plan){
    // Check our arguments against their expected patterns. This is especially
    // important here because we're dealing with sensitive customer information.
    check(customerId, String);
    check(plan, String);

    // Because Braintree's API is asynchronous (meaning it doesn't block our function
    // from running once it's started), we need to make use of the Fibers/Future
    // library. This allows us to create a return object that "waits" for us to
    // return a value to it.
    var btSubscription = new Future();

    // First, we'll fetch our customer data.
    Meteor.call('btFindCustomer', customerId, function(error, result) {
      if (error) {
        btSubscription.return(error);
      } else {
        // Storing paymentMethodToken and plan name (id) in variable which we 
        // will use for creating subscription.
        var subscriptionRequest = {
          paymentMethodToken: result.creditCards[0].token,
          planId: plan
        };

        // If all is well, we'll use Braintree API to create our subscription!
        gateway.subscription.create(subscriptionRequest, function(error, result) {
          if (error) {
            btSubscription.return(error);
          } else {
            btSubscription.return(result);
          }
        });
      }
    });

    return btSubscription.wait();
  },

  btFindSubscription: function(subscriptionId) {
    // Check our arguments against their expected patterns. This is especially
    // important here because we're dealing with sensitive customer information.
    check(subscriptionId, String);

    // Because Braintree's API is asynchronous (meaning it doesn't block our function
    // from running once it's started), we need to make use of the Fibers/Future
    // library. This allows us to create a return object that "waits" for us to
    // return a value to it.
    var btSubscription = new Future();

    // If all is well, we'll Braintree API to find our customer!
    gateway.subscription.find(subscriptionId, function(error, result) {
      if (error) {
        btSubscription.return(error);
      } else {
        btSubscription.return(result);
      }
    });

    return btSubscription.wait();
  },

  btFindUserSubscription: function(customerId) {
    // Check our arguments against their expected patterns. This is especially
    // important here because we're dealing with sensitive customer information.
    check(customerId, String);

    // Because Braintree's API is asynchronous (meaning it doesn't block our function
    // from running once it's started), we need to make use of the Fibers/Future
    // library. This allows us to create a return object that "waits" for us to
    // return a value to it.
    var btUserSubscription = new Future();

    // If all is well, we'll use Braintree API to find our customer!
    gateway.customer.find(customerId, function(error, result) {
      if (error) {
        btUserSubscription.return(error);
      } else {
        // We retrieve customer's last subscription here.
        var subscriptionId = result.paymentMethods[0].subscriptions;
        var last = subscriptionId.slice(-1)[0];

        btUserSubscription.return(last);
      }
    });

    return btUserSubscription.wait();
  },

  btUpdateSubscription: function(plan){
    // Check our arguments against their expected patterns. 
    check(plan, String);

    // Because Braintree's API is asynchronous (meaning it doesn't block our function
    // from running once it's started), we need to make use of the Fibers/Future
    // library. This allows us to create a return object that "waits" for us to
    // return a value to it.
    var btUpdateSubscription = new Future();

    // Before we jump into everything, we need to get our customer's ID. Recall
    // that we can't send this over from the client because we're *not* publishing
    // it to the client. Instead, here, we take the current userId from Meteor
    // and lookup our customerId.
    var user    = Meteor.userId();
    var getUser = Meteor.users.findOne({"_id": user}, {fields: {"customerId": 1}});

    // We retrieve plan's price (in braintree's format from "price" inside plan array defined
    // in /settings.json).
    var availablePlans = Meteor.settings.public.plans;
    var currentPlan    = _.find(availablePlans, function(plans){ return plans.name == plan; });
    var limit          = currentPlan.limit;
    var price          = currentPlan.price;

    Meteor.call('btFindUserSubscription', getUser.customerId, function(error, customerSubscription){
      if (error){
        btUpdateSubscription.return(error);
      } else {
        // If all is well, call to the Braintree API to update our subscription! 
        gateway.subscription.update(customerSubscription.id, {
          planId: plan,
          price: price
        }, function(error, response){
          if (error) {
            btUpdateSubscription.return(error);
          } else {

            // We successfully updated subscription on Braintree servers, but we need to update user
            // plan inside our database on server too! First we should find user's subscription here:
            gateway.subscription.find(customerSubscription.id, function(error, updatedSubscription) {
              if (error){
                btUpdateSubscription.return(error);
              } else {

                // Second we create our update object (don't forget SERVER_AUTH_TOKEN)...
                // Note: we're using a Fiber() here because we're calling to Meteor code from
                // within another function's callback (without this Meteor will throw an error).
                Fiber(function(){
                  var update = {
                    auth: SERVER_AUTH_TOKEN,
                    user: user,
                    plan: plan,
                    status: updatedSubscription.status,
                    date: updatedSubscription.nextBillingDate
                  }

                  // And then we pass our update over to our updateUserPlan method.
                  Meteor.call('updateUserPlan', update, function(error, updateResponse){
                    if (error){
                      btUpdateSubscription.return(error);
                    } else {
                      btUpdateSubscription.return(updateResponse);
                    }
                  });
                }).run();
              }
            });
          }
        });
      }
    });

    return btUpdateSubscription.wait();
  },

  btUpdateCard: function(updates){
    // Check our arguments against their expected patterns. This is especially
    // important here because we're dealing with sensitive customer information.
    check(updates, {
      expMonth: String,
      expYear: String,
    });

    // Because Braintree's API is asynchronous (meaning it doesn't block our function
    // from running once it's started), we need to make use of the Fibers/Future
    // library. This allows us to create a return object that "waits" for us to
    // return a value to it.
    var btUpdateCard = new Future();

    // Before we jump into everything, we need to get our customer's ID. Recall
    // that we can't send this over from the client because we're *not* publishing
    // it to the client. Instead, here, we take the current userId from Meteor
    // and lookup our customerId.
    var user    = Meteor.userId();
    var getUser = Meteor.users.findOne({"_id": user}, {fields: {"customerId": 1}});

    // Because we're not storing our user's card ID, we need to call Braintree first to
    // retrieve that information before we perform the update. This is key, because
    // without it, Braintree won't know which card to update. Once we have this info,
    // we call to Braintree *again* to update our customer's profile.
    Meteor.call('btFindCustomer', getUser.customerId, function(error, response){
      if (error){
        btUpdateCard.return(error);
      } else {
        var token = response.creditCards[0].token;

        var updateRequest = {
          creditCard: {
            expirationMonth: updates.expMonth,
            expirationYear: updates.expYear,
            options: { 
              updateExistingToken: token 
            }
          }
        };

        // If all is well, call to the Braintree API to update our card!
        gateway.customer.update(getUser.customerId, updateRequest, function(error, customer){
          if (error) {
            btUpdateCard.return(error);
          } else {
            btUpdateCard.return(customer);
          }
        });
      }
    });

    return btUpdateCard.wait();
  },

  btSwapCard: function(card){
    // Check our arguments against their expected patterns. This is especially
    // important here because we're dealing with sensitive customer information.
    check(card, {
      number: String,
      cvv: String,
      expirationMonth: String,
      expirationYear: String,
      billingAddress: {
        postalCode: String
      }
    });

    // Because Braintree's API is asynchronous (meaning it doesn't block our function
    // from running once it's started), we need to make use of the Fibers/Future
    // library. This allows us to create a return object that "waits" for us to
    // return a value to it.
    var btSwapCard = new Future();

    // Before we jump into everything, we need to get our customer's ID. Recall
    // that we can't send this over from the client because we're *not* publishing
    // it to the client. Instead, here, we take the current userId from Meteor
    // and lookup our customerId.
    var user    = Meteor.userId();
    var getUser = Meteor.users.findOne({"_id": user}, {fields: {"customerId": 1}});

    Meteor.call('btFindCustomer', getUser.customerId, function(error, response){
      if (error){
        concsole.log(error)
        btSwapCard.return(error);
      } else {
        var token = response.creditCards[0].token;

        var updateRequest = {
          creditCard: {
            number: card.number,
            cvv: card.cvv,
            expirationMonth: card.expirationMonth,
            expirationYear: card.expirationYear,
            billingAddress: card.billingAddress,
            options: { 
              updateExistingToken: token 
            }
          }
        };

        // If all is well, call to the Braintree API to update our card!
        gateway.customer.update(getUser.customerId, updateRequest, function(error, updateResponse){
          if (error) {
            btSwapCard.return(error);
          } else {
            var card = {
              lastFour: updateResponse.customer.creditCards[0].last4,
              type: updateResponse.customer.creditCards[0].cardType
            }
            // Because we're running Meteor code inside of an async callback, we need to wrap
            // it in a Fiber. Note: this is a verbose way of doing this. You could refactor this
            // and the call to Braintree to use a Meteor.wrapAsync method instead. The difference is
            // that while wrapAsync is cleaner syntax-wise, it can be a bit confusing.
            Fiber(function(){
              var update = {
                auth: SERVER_AUTH_TOKEN,
                user: user,
                card: card
              }
              // And then we pass our update over to our updateUserPlan method.
              Meteor.call('updateUserCard', update, function(error, response){
                if (error){
                  btSwapCard.return(error);
                } else {
                  btSwapCard.return(response);
                }
              });
            }).run();
          }
        });
      }
    });

    return btSwapCard.wait();
  },

  btCancelSubscription: function(){
    // Because Braintree's API is asynchronous (meaning it doesn't block our function
    // from running once it's started), we need to make use of the Fibers/Future
    // library. This allows us to create a return object that "waits" for us to
    // return a value to it.
    var btCancelSubscription = new Future();

    // Before we jump into everything, we need to get our customer's ID. Recall
    // that we can't send this over from the client because we're *not* publishing
    // it to the client. Instead, here, we take the current userId from Meteor
    // and lookup our customerId.
    var user    = Meteor.userId();
    var getUser = Meteor.users.findOne({"_id": user}, {fields: {"customerId": 1}});

    Meteor.call('btFindUserSubscription', getUser.customerId, function(error, customerSubscription){
      if (error){
        btUpdateSubscription.return(error);
      } else {
        // Once we have our customerId, call to Braintree to cancel the active subscription.
        gateway.subscription.cancel(customerSubscription.id, function(error, result){
          if (error) {
            btCancelSubscription.return(error);
          } else {
            // Because we're running Meteor code inside of another function's callback, we need to wrap
            // it in a Fiber. 
            Fiber(function(){
              var update = {
                auth: SERVER_AUTH_TOKEN,
                user: user,
                subscription: {
                  status: "Canceled",
                  ends: customerSubscription.paidThroughDate
                }
              }
              // And then we pass our update over to our updateUserSubscription method.
              Meteor.call('updateUserSubscription', update, function(error, response){
                if (error){
                  btCancelSubscription.return(error);
                } else {
                  btCancelSubscription.return(response);
                }
              });
            }).run();
          }
        });
      }
    });

    return btCancelSubscription.wait();
  },

  btResubscribe: function(plan) {
    check(plan, String);

    // Before we jump into everything, we need to get our customer's ID. Recall
    // that we can't send this over from the client because we're *not* publishing
    // it to the client. Instead, here, we take the current userId from Meteor
    // and lookup our customerId.
    var user    = Meteor.userId();
    var getUser = Meteor.users.findOne({"_id": user}, {fields: {"customerId": 1}});

    var btResubscribe = new Future();

    Meteor.call('btFindCustomer', getUser.customerId, function(error, customer) {
      if (error) {
        btResubscribe.return(error);
      } else {

        var subscriptionRequest = {
          paymentMethodToken: customer.creditCards[0].token,
          planId: plan
        };

        // If all is well, call to the Braintree API to create our subscription!
        // Note: here, we're only passing the customerId (created by Braintree) and the
        // name of the plan (the plan name will match an ID we set in the dashboard, 
        // equal to the lowercase name of the plan).
        gateway.subscription.create(subscriptionRequest, function(error, result) {
          if (error) {
            btResubscribe.return(error);
          } else {
            Fiber(function(){
              var update = {
                auth: SERVER_AUTH_TOKEN,
                user: user,
                plan: plan,
                status: result.subscription.status,
                date: result.subscription.nextBillingDate
              }
              // And then we pass our update over to our updateUserPlan method.
              Meteor.call('updateUserPlan', update, function(error, updateResponse){
                if (error){
                  btResubscribe.return(error);
                } else {
                  btResubscribe.return(updateResponse);
                }
              });
            }).run();
          }
        });
      }
    });

    return btResubscribe.wait();
  }
});
