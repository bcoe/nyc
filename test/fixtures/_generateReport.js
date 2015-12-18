'use strict'

// Generates the test/fixtures/report.js file, not otherwise used in the
// tests.

var fs = require('fs')
var path = require('path')

var _ = require('lodash')
var rimraf = require('rimraf')
var sourceMapFixtures = require('source-map-fixtures')

var NYC = require('../../')

// Load source map fixtures.
var fixtures = {
  bundle: sourceMapFixtures.inline('bundle'),
  inline: sourceMapFixtures.inline('branching'),
  istanbulIgnore: sourceMapFixtures.inline('istanbul-ignore'),
  none: sourceMapFixtures.none('branching')
}

// Inject nyc into this process.
var nyc = (new NYC({
  cwd: path.join(__dirname, '..', '..')
})).wrap()
// Override the exclude option, source-map-fixtures is inside node_modules but
// should not be excluded when generating the coverage report.
nyc.exclude = []

// Require the fixture so nyc can instrument it, then run it so there's code
// coverage.
fixtures.bundle.require().branching()
fixtures.inline.require().run(42)
fixtures.istanbulIgnore.require().run(99)
fixtures.none.require().run()

// Copy NYC#writeCoverageFile() behavior to get the coverage object, before
// source maps have been applied.
var coverage = global.__coverage__
if (typeof __coverage__ === 'object') coverage = __coverage__
if (!coverage) {
  console.error('No coverage.')
  process.exit(1)
}

var reports = _.values(coverage)
if (reports.length !== 4) {
  console.error('Expected 4 reports to be generated, got ' + reports.length)
  process.exit(1)
}

var out = fs.createWriteStream(path.join(__dirname, 'report.js'))
out.write('// Generated using node test/fixtures/_generateReport.js\n')
reports.forEach(function (coverage) {
  out.write('exports[' + JSON.stringify(coverage.path) + '] = ' + JSON.stringify(coverage, null, 2) + '\n')
})
out.end()
out.on('finish', function () {
  console.log('Written coverage report.')
})
