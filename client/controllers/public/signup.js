/*
* Controller: Signup
* Template: /client/views/public/signup.html
*/

/*
* Rendered
*/

Template.signup.rendered = function(){
  $('#application-signup').validate({
    rules: {
      name: {
        required: true
      },
      emailAddress: {
        required: true,
        email: true
      },
      password: {
        required: true,
        minlength: 6
      },
      cardNumber: {
        creditcard: true,
        required: true
      },
      expMo: {
        required: true
      },
      expYr: {
        required: true
      },
      cvv: {
        required: true
      },
      postalCode: {
        required: true
      }
    },
    messages: {
      name: {
        required: "Please enter your name."
      },
      emailAddress: {
        required: "Please enter your email address to sign up.",
        email: "Please enter a valid email address."
      },
      password: {
        required: "Please enter a password to sign up.",
        minlength: "Please use at least six characters."
      },
      cardNumber: {
        creditcard: "Please enter a valid credit card.",
        required: "Required."
      },
      expMo: {
        required: "Required."
      },
      expYr: {
        required: "Required."
      },
      cvv: {
        required: "Required."
      },
      postalCode: {
        required: "Please enter postal code."
      }
    },
    submitHandler: function(){
      // Grab the customer's details.
      customer = {
        name: $('[name="fullName"]').val(),
        emailAddress: $('[name="emailAddress"]').val(),
        password: $('[name="password"]').val(),
        plan: $('[name="selectPlan"]:checked').val(),
        creditCard: {
          number: $('[name="cardNumber"]').val(),
          cvv: $('[name="cvv"]').val(),
          expirationMonth: $('[name="expMo"]').val(),
          expirationYear: $('[name="expYr"]').val(),
          billingAddress: {
            postalCode: $('[name="postalCode"]').val()
          }
        }
      }
      console.log(customer);
      // Trigger state on the button/form to improve the UX a bit.
      var submitButton = $('input[type="submit"]').button('loading');

      // Call to our createTrialCustomer method on the server.
      Meteor.call('createTrialCustomer', customer, function(error, response){
        if (error) {
          alert(error.reason);
          // If creation fails, make sure to "reset" our signup interface.
          submitButton.button('reset');
        } else {
          // Note: because we're using a Future to return a value, even if an error
          // occurs on the server, it will be passed back to the client as the
          // response argument. Here, we test to make sure we didn't receive an error
          // in our response before continuing.
          if ( response.error ) {
            alert(response.message);
            // If creation fails, make sure to "reset" our signup interface.
            submitButton.button('reset');
          } else {
            // Our user exists, so now we can log them in! Note: because we know
            // that we created our user using the emailAddress and password values
            // above, we can simply login with these :) Hot dog, indeed.
            Meteor.loginWithPassword(customer.emailAddress, customer.password, function(error){
              if (error) {
                alert(error.reason);
                // If login fails, make sure to "reset" our signup interface.
                submitButton.button('reset');
              } else {
                Router.go('/lists');
                // If creation fails, make sure to "reset" our signup interface.
                submitButton.button('reset');
              }
            });
          }
        }
      });
    }
  });
}

/*
* Events
*/

Template.signup.events({
  'submit form': function(e){
    // Prevent form from submitting.
    e.preventDefault();
  }
});
