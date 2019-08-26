import { assert } from 'chai';
import fs from 'fs';
import { AST } from '../src/ast/ast';

describe('Decode test suite', function() {
  
  it('can parse document', function() {
    let file = "tests/testfiles/markup.pipe";
    fs.readFile(file, 'utf-8', (err, data) => {
      if (err)
        assert.fail(err);

      let ast = new AST();
      let astNodes = ast.decode(data);

      assert.isNotEmpty(astNodes);
    });
  });
});