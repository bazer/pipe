#!/usr/bin/env node

import program from 'commander';
import fs from 'fs';
import { Parser } from '../reader/parser';
// Require logic.js file and extract controller functions using JS destructuring assignment

program
  .version('0.0.1')
  .description('Pipe Markup Language')
  .usage('command [options] <files ...>');
  
  
program
  .command('check <file>')
  .alias('c')
  .description('Check for errors')
  .action((file) => {
    fs.readFile(file, 'utf-8', (err, data) => {
      if (err)
        console.log(err);

      let parser = new Parser(data);
      let nodes = parser.parse();

      console.log(nodes);
    });
    // addContact({firstname, lastname, phone, email});
  });

// program
//   .command('getContact <name>')
//   .alias('r')
//   .description('Get contact');
//   .action(name => getContact(name));

program.parse(process.argv);