#!/usr/bin/env node

const path = require('path')

module.exports = require(path.join(__dirname, '..', 'src', 'server'))()
