# How to test the dns_parser

## Simple test

Run `npm install && npm run test` to run the current set of tests. These tests compare DNS payloads with the expected (parsed) output. Tests pickup the test cases from `fixtures/fixtures.json`.

## Adding functionality

If adding new functionality to the parser, then you might need to add new test cases. You can re-run the parser over the existing DNS payloads with `npm run fixtures <filename>`. Once you're happy with your changes you can override the existing tests on `fixtures/fixtures.json`. Thanks for contributing!