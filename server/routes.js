/*
* Server Routes
* Server-side routes for receiving data from third-party services.
*/

// https://github.com/iron-meteor/iron-router/issues/1003
Router.onBeforeAction(Iron.Router.bodyParser.urlencoded({
    extended: false
}));

// Setting up Braintree
var gateway;

Meteor.startup(function () {
  var braintree = Meteor.npmRequire('braintree');
  gateway = braintree.connect({
    environment: braintree.Environment.Sandbox,
    publicKey: Meteor.settings.public.braintree.BT_PUBLIC_KEY,
    privateKey: Meteor.settings.private.braintree.BT_PRIVATE_KEY,
    merchantId: Meteor.settings.public.braintree.BT_MERCHANT_ID
  });
});

// Node.js style!
Router.route('/webhooks/braintree', {where: 'server'})
  .get(function (req, res) {
    // Defining empty bt_challenge string which will be used to verify destination. 
    // https://developers.braintreepayments.com/javascript+node/guides/webhooks/create
    var bt_challenge = "";

    res.statusCode = 200;
    res.end(gateway.webhookNotification.verify(req.query.bt_challenge));
  })
  .post(function (req, res) {
    
    var btSignatureParam = req.body.bt_signature;
    var btPayloadParam   = req.body.bt_payload;

    gateway.webhookNotification.parse(
      btSignatureParam,
      btPayloadParam,
      function (err, webhookNotification) {
        console.log("[Webhook Received " + webhookNotification.timestamp + "] | Kind: " + webhookNotification.kind + " | Subscription: " + webhookNotification.subscription.id);

        switch(webhookNotification.kind){
          case "subscription_canceled":
            // TODO: Function below needs testing.
            // btUpdateSubscription(webhookNotification.subscription);

            // Send HTTP 200 status code to let Braintree know
            // that we received webhook notification
            res.statusCode = 200;
            res.end("Hi Braintree!");
            break;
          case "subscription_charged_successfully":
            btCreateInvoice(webhookNotification.subscription);

            // Send HTTP 200 status code to let Braintree know
            // that we received webhook notification
            res.statusCode = 200;
            res.end("Hi Braintree!");
            break;
        }

      }
    );

    res.statusCode = 200;
    res.end("Hi Braintree!");
  });

