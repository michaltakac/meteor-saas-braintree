MeteorJS + Braintree = SaaS
---

A subscription-based app (SaaS) example that shows one way of integration Braintree into your meteor application.
[Try it here!](http://saas-braintree.meteor.com)

### Disclaimer

This is basically a refractored version of The Meteor Chef's [saas-stripe](https://github.com/themeteorchef/saas-stripe) app. It uses Braintree instead of Stripe. 

### Initial setup

0. [Install Meteor](https://www.meteor.com/install)
1. Clone this repo `git clone https://github.com/michaltakac/meteor-saas-braintree.git`
2. [Create a sandbox account](https://www.braintreepayments.com/get-started)
3. [Login](https://sandbox.braintreegateway.com/login) to the braintree sandbox
4. Retrieve your api keys (navigate to: My User > Api Keys)
5. Insert the keys into `settings.json`
6. Inside Braintree sandbox, navigate to Plans from left menu under `Reccuring Billing` 
7. Create 2 plans with id's "pro" and "standard" respectively (lowercase for Plan ID, Plan Name's should be "Pro and "Standard") 
8. Fill other inputs with information from `settings.json` (Price: 9.99 for Pro, 5.99 for Standard, do not include Trial Period, Billing Cycle Every 1 Month(s), First Bill Date - Immediately, End Date - Never)*, now hit `Create` button

*You can create whatever plans you want, but "Plan ID" from Braintree must be equal to "name" from `settings.json` and "Price" from Braintree must be equal to "price" from `settings.json`. You can play with it.

### Start

```bash
$ meteor --settings settings.json
```
### Invoices

Invoices only works if you deploy your app on the web, because they are generated using Braintree's webhooks. There is a easy way to make it work:

1. Deploy your app to Meteor servers, for example: 
`meteor deploy my-saas-app.meteor.com --settings settings.json`
2. Inside Braintree sandbox, navigate to Settings > Webhooks (inside top menu)
3. Click on `New webhook`, insert `my-saas-app.meteor.com/webhooks/braintree` URL into "Destination", check "Subscription canceled" and "Subscription charged successfully" and click `Create Webhook`
4. It should be added now and after you create new subscription inside your app at `my-saas-app.meteor.com`, it will generate new invoice

### Issues?

For issues related to this repo, please submit an issue on github.
Any braintree related problems should be directed to [Braintree Support](https://support.braintreepayments.com/) or [#braintree](http://stackoverflow.com/questions/tagged/braintree) on StackOverflow.
