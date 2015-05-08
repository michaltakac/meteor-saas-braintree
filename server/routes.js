/*
* Server Routes
* Server-side routes for receiving data from third-party services.
*/

Router.onBeforeAction(Iron.Router.bodyParser.urlencoded({
    extended: false
}));

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

    // When you attempt to create a new webhook, Braintree servers will make a GET request 
    // to the provided URL with a query param named bt_challenge. This query param 
    // should be passed to the gateway.webhookNotification.verify. The result of calling 
    // this method should be returned as the body of the response. Our site must parse and respond 
    // to this verification request before Braintree will send webhooks to our destination URL.
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
        console.log()

        switch(webhookNotification.kind){
          case "subscription_went_past_due":
            console.log(Object.keys(webhookNotification.subscription));
            // btUpdateSubscription(webhookNotification.subscription);
            break;
          case "subscription_charged_successfully":
            btCreateInvoice(webhookNotification.subscription);
            break;
        }

      }
    );

    res.statusCode = 200;
    res.end(200);
  });

