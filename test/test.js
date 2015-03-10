var Browser = require('zombie');
var assert  = require('assert');

// We call our test example.com
Browser.localhost('localhost', 3300);

var browser = Browser.create();

describe('Idea', function(){
  before(function(done) {
    browser.visit('/create', function (error) {
      browser.
        fill('title', 'TITLE').
        select('category', 'App').
        fill('subheader', 'SUBHEADER').
        fill('bullets[0]', 'B1').
        fill('bullets[1]', 'B2').
        fill('bullets[2]', 'B3').
        pressButton('.button', function(error) {
          done();
        });
    });
  });

  it('should be created when I fill in values', function(){
    browser.assert.success();
    browser.assert.text('.idea:last-child h3', 'TITLE App');
    browser.assert.text('.idea:last-child ul li:last-child', 'B3');
  });
});