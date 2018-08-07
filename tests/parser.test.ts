import { assert } from 'chai';
import Parser from '../src/reader/parser';

describe('Parser test suite', function() {
  it('can handle empty string', function() {
    let parser = new Parser("");
    let result = parser.parse();

    assert.isEmpty(result);
  });
});