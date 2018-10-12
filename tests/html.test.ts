import { assert } from 'chai';
import fs from 'fs';
import { AST } from '../src/ast/ast';
import { HtmlEncoder } from '../src/html/htmlencoder';

describe('HTML test suite', function() {
  
  it('can convert pipe to html', function() {
    let file = "tests/testfiles/markup.pipe";
    fs.readFile(file, 'utf-8', (err, data) => {
      if (err)
        assert.fail(err);

      let ast = new AST();
      let astNodes = ast.decode(data);
      
      let encoder = new HtmlEncoder();
      let htmlNodes = encoder.encode(astNodes);

      let html = encoder.getHtmlString(htmlNodes);
      assert.isNotEmpty(html);
    });
  });
});