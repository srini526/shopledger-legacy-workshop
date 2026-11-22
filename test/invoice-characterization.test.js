var test = require('node:test');
var assert = require('node:assert/strict');

var invoice = require('../lib/invoice');
var pricing = require('../lib/pricing');
var reports = require('../lib/reports');

test('invoice uses the HSN GST rate when the billed line has no gstRate', function () {
  var items = [{
    id: 1,
    name: 'Rice',
    sku: 'RICE-1',
    hsn: '1006',
    price: 1000,
    qty: 1
  }];
  var billed = pricing.computeTotals(items, 'SAVE10');
  var printed = invoice.computeInvoiceFigures({ items: items, coupon: 'SAVE10' });

  assert.deepEqual(
    { tax: billed.tax, total: billed.total },
    { tax: 45, total: 945 }
  );
  assert.deepEqual(
    { tax: printed.tax, total: printed.total, gstPercent: printed.rows[0].gstPercent },
    { tax: 45, total: 945, gstPercent: 5 }
  );
});

test('invoice applies the capped percentage coupon discount before GST', function () {
  var items = [{
    id: 2,
    name: 'Tea',
    sku: 'TEA-1',
    hsn: '0902',
    price: 5000,
    qty: 1
  }];
  var billed = pricing.computeTotals(items, 'SAVE10');
  var printed = invoice.computeInvoiceFigures({ items: items, coupon: 'SAVE10' });

  assert.deepEqual(
    { discount: billed.discount, tax: billed.tax, total: billed.total },
    { discount: 150, tax: 873, total: 5723 }
  );
  assert.deepEqual(
    { discount: printed.discount, tax: printed.tax, total: printed.total },
    { discount: 150, tax: 873, total: 5723 }
  );
});

test('GST reconciliation matches stored billed amounts against invoice figures', function () {
  var items = [{
    id: 1,
    name: 'Rice',
    sku: 'RICE-1',
    hsn: '1006',
    price: 1000,
    qty: 1
  }];
  var billed = pricing.computeTotals(items, 'SAVE10');
  var db = {
    products: [],
    customers: [],
    orders: [{
      id: 99,
      date: '01/01/2022',
      customer: 'Walk-in',
      coupon: 'SAVE10',
      status: 'completed',
      items: items,
      subtotal: billed.subtotal,
      discount: billed.discount,
      tax: billed.tax,
      total: billed.total
    }]
  };

  var reconciliation = reports.getGstReconciliation(db);

  assert.deepEqual(
    reconciliation,
    {
      totalChecked: 1,
      mismatchCount: 0,
      totalDelta: 0,
      rows: [{
        orderId: 99,
        date: '01/01/2022',
        customer: 'Walk-in',
        coupon: 'SAVE10',
        ledgerSubtotal: 1000,
        ledgerDiscount: 100,
        ledgerTax: 45,
        ledgerTotal: 945,
        invoiceDiscount: 100,
        invoiceTax: 45,
        invoiceTotal: 945,
        delta: 0,
        matched: true
      }]
    }
  );
});
