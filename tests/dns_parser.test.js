const parse_wire_message = require('../scripts/dns_parser.js');
const tests = require('./fixtures.json');

// one test case per wireMessage
Object.entries(tests).map(
    ([wireMessage, parsedOutput]) => {
        test(`Testing parser output ${wireMessage.slice(0,8)}`, () => {

            expect(
                parse_wire_message(wireMessage)
            ).toStrictEqual(  // .toBe() does a shallow comparison and fails...
                parsedOutput
            )
        });
    }
)
