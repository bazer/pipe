#!/usr/bin/env node

import program from 'commander';
import fs from 'fs';
import { HtmlEncoder } from '../html/htmlencoder';
import AST from '../ast/ast';
// Require logic.js file and extract controller functions using JS destructuring assignment

program
  .version('0.0.1')
  .description('Pipe Markup Language HTML Converter')
  .usage('command [options] <files ...>');
  
  
program
  .command('convert <file> <newFile>')
  .alias('c')
  .description('Convert to and from HTML')
  .action((file, newFile) => {
    fs.readFile(file, 'utf-8', (err, data) => {
      if (err)
        console.log(err);

      let ast = new AST();
      let astNodes = ast.decode(data);

      let encoder = new HtmlEncoder();
      let htmlNodes = encoder.encode(astNodes);

      let html = encoder.getHtmlString(htmlNodes);

      fs.writeFile(newFile, html, err => {
        console.log(err);
      })

      //console.log(astNodes);
    });
    // addContact({firstname, lastname, phone, email});
  });

// program
//   .command('getContact <name>')
//   .alias('r')
//   .description('Get contact');
//   .action(name => getContact(name));

program.parse(process.argv);