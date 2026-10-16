import { defineData } from '../../src/index';

// Test data in test/data, written "{users.member.username}" in feature files. A project keeps
// it in data/, which loads by itself.
defineData('test/data');
