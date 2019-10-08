import { assert } from 'chai';
import Parser from '../src/reader/parser';

describe('Parser test suite', function() {
  
  it('can parse empty string', function() {
    let parser = new Parser("");
    let result = parser.parse();

    assert.isEmpty(result);
  });

  it('can parse simple text', function() {
    let parser = new Parser("Simple text");
    let result = parser.parse();

    assert.isNotEmpty(result);
    assert.equal(result.length, 1);
    assert.equal(result[0].name, "t");
    assert.equal(result[0].children.length, 3);
    assert.equal(result[0].children[0].name, "w");
    assert.equal(result[0].children[0].value, "Simple");
    assert.equal(result[0].children[1].name, "_");
    assert.equal(result[0].children[1].amount, 1);
    assert.equal(result[0].children[2].name, "w");
    assert.equal(result[0].children[2].value, "text");
  });

  it('can parse element', function() {
    let parser = new Parser("[h1|Lorem ipsum dolor sit amet]");
    let result = parser.parse();

    assert.isNotEmpty(result);
    assert.equal(result.length, 1);
    assert.equal(result[0].name, "h");
    assert.equal(result[0].amount, 1);
    assert.equal(result[0].children.length, 1);
    assert.equal(result[0].children[0].name, "t");
    assert.equal(result[0].children[0].children.length, 9);
  });


  it('can parse element without brackets', function() {
    let parser = new Parser("b|Lorem");
    let result = parser.parse();

    assert.isNotEmpty(result);
    assert.equal(result.length, 1);
    assert.equal(result[0].name, "h");
    assert.equal(result[0].amount, 1);
    assert.equal(result[0].children.length, 1);
    assert.equal(result[0].children[0].name, "t");
    assert.equal(result[0].children[0].children.length, 9);
  });

  it('can parse element without brackets', function() {
    let parser = new Parser("b|Lorem_ipsum_dolor_sit_amet");
    let result = parser.parse();
  
    assert.isNotEmpty(result);
    assert.equal(result.length, 1);
    assert.equal(result[0].name, "h");
    assert.equal(result[0].amount, 1);
    assert.equal(result[0].children.length, 1);
    assert.equal(result[0].children[0].name, "t");
    assert.equal(result[0].children[0].children.length, 9);
  });

});