import { assert } from 'chai';
import InputStream from '../src/reader/inputstream';

describe('InputStream test suite', function() {
  
  it('can parse empty string', function() {
    let stream = new InputStream("");
    assert.isTrue(stream.eof());
  });

  it('can track position', function() {
    let stream = new InputStream("Text on row 1\nText on row 2");

    assert.isFalse(stream.eof());

    let lastPos = stream.getLastPos();
    let currentPos = stream.getCurrentPos();
    assert.deepEqual(lastPos, currentPos);

    assert.equal(currentPos.character, 0);
    assert.equal(currentPos.line, 1);
    assert.equal(currentPos.column, 1);

    let char = stream.peek();
    let sameChar = stream.next();
    assert.equal(char, sameChar);

    currentPos = stream.getCurrentPos();
    assert.equal(currentPos.character, 1);
    assert.equal(currentPos.line, 1);
    assert.equal(currentPos.column, 2);

    while (stream.next() != '\n') {
    }

    lastPos = stream.getLastPos();
    assert.equal(lastPos.character, 13);
    assert.equal(lastPos.line, 1);
    assert.equal(lastPos.column, 14);

    currentPos = stream.getCurrentPos();
    assert.equal(currentPos.character, 14);
    assert.equal(currentPos.line, 2);
    assert.equal(currentPos.column, 1);

    assert.equal('T', stream.next());

    while (!stream.eof()) {
      char = stream.next();
    }

    assert.equal('2', char);

    lastPos = stream.getLastPos();
    assert.equal(lastPos.character, 26);
    assert.equal(lastPos.line, 2);
    assert.equal(lastPos.column, 13);

    currentPos = stream.getCurrentPos();
    assert.equal(currentPos.character, 27);
    assert.equal(currentPos.line, 2);
    assert.equal(currentPos.column, 14);
  });

});