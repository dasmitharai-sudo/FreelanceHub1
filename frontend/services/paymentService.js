angular.module('freelanceHubApp')
.factory('PaymentService', ['$http', '$q', '$window', '$rootScope', function ($http, $q, $window, $rootScope) {
  return {
    getWallet: function () {
      return $http.get('/api/payments/wallet').then(function (res) { return res.data; });
    },

    requestWithdrawal: function (data) {
      return $http.post('/api/payments/withdraw', data).then(function (res) { return res.data; });
    },

    getTransactions: function () {
      return $http.get('/api/payments/transactions').then(function (res) { return res.data; });
    },

    getCommissionRate: function () {
      return $http.get('/api/payments/commission-rate').then(function (res) { return res.data; });
    },

    // Process Razorpay Test Checkout
    processCheckout: function (options) {
      var deferred = $q.defer();
      var amount = options.amount;
      var itemName = options.itemName || 'FreelanceHub Service Purchase';
      var user = $rootScope.currentUser || {};

      // 1. Create order on backend
      $http.post('/api/payments/create-order', {
        amount: amount,
        receipt: 'rcpt_' + Date.now()
      }).then(function (res) {
        if (!res.data.success) {
          deferred.reject('Failed to initialize payment gateway.');
          return;
        }

        var orderData = res.data.order;
        var keyId = res.data.keyId;

        // If Razorpay SDK is available and not a placeholder key
        if ($window.Razorpay && !keyId.includes('FreelanceHubDemoKey')) {
          var rzpOptions = {
            key: keyId,
            amount: orderData.amount,
            currency: 'INR',
            name: 'FreelanceHub',
            description: itemName,
            image: '/assets/images/logo.svg',
            order_id: orderData.id,
            handler: function (response) {
              // Verify on backend
              $http.post('/api/payments/verify', response).then(function (vRes) {
                deferred.resolve({
                  razorpayOrderId: response.razorpay_order_id,
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpaySignature: response.razorpay_signature
                });
              }).catch(function (err) {
                deferred.reject('Payment signature verification failed.');
              });
            },
            prefill: {
              name: user.name || '',
              email: user.email || '',
              contact: user.phone || ''
            },
            theme: {
              color: '#4f46e5'
            },
            modal: {
              ondismiss: function () {
                deferred.reject('Payment checkout was closed by user.');
              }
            }
          };

          var rzp = new $window.Razorpay(rzpOptions);
          rzp.open();
        } else {
          // Sleek Academic Test Mode / Escrow Simulation Modal
          var mockPaymentId = 'pay_demo_' + Date.now();
          var mockOrderId = orderData.id;
          var mockSignature = 'simulated_test_signature';

          // Trigger Custom Test Checkout Dialog
          $rootScope.activeTestPayment = {
            amount: amount,
            itemName: itemName,
            orderId: mockOrderId,
            confirmPayment: function () {
              $('#razorpayTestModal').modal('hide');
              deferred.resolve({
                razorpayOrderId: mockOrderId,
                razorpayPaymentId: mockPaymentId,
                razorpaySignature: mockSignature
              });
            },
            cancelPayment: function () {
              $('#razorpayTestModal').modal('hide');
              deferred.reject('Payment cancelled by user.');
            }
          };

          // Show modal
          $('#razorpayTestModal').modal('show');
        }
      }).catch(function (err) {
        deferred.reject(err.data && err.data.message ? err.data.message : 'Error contacting payment server.');
      });

      return deferred.promise;
    }
  };
}]);
