var test = require('node:test');
var assert = require('node:assert/strict');

var invoice = require('../lib/invoice');

test('invoice total and GST breakdown match the amounts billed to the customer', function () {
  var order = {
    id: 99,
    coupon: 'SAVE10',
    items: [{
      id: 1,
      name: 'Rice',
      sku: 'RICE-1',
      hsn: '1006',
      price: 1000,
      qty: 1
    }],
    subtotal: 1000,
    discount: 100,
    tax: 45,
    total: 945
  };

  assert.deepEqual(invoice.computeInvoiceFigures(order), {
    subtotal: 1000,
    discount: 100,
    tax: 45,
    cgst: 22.5,
    sgst: 22.5,
    total: 945,
    rows: [{
      name: 'Rice',
      sku: 'RICE-1',
      hsn: '1006',
      qty: 1,
      price: 1000,
      gstPercent: 5,
      line: 1000,
      lineTax: 45
    }]
  });
});
