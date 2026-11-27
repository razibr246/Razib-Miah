const test = require('node:test');
const assert = require('node:assert/strict');
const { rankSources } = require('./assistant');

const ids = q => rankSources(q).map(d => d.id);

test('each question reaches the fact that answers it', () => {
  const cases = [
    ['What did he build for legal aid?', 'project-dlas'],
    ['Tell me about ShasthoGrid', 'project-shasthogrid'],
    ['Is he available for freelance work?', 'contact'],
    ['What does he study?', 'education'],
    ['Does he know Rust?', 'skills-core'],
    ['What are his hobbies?', 'beyond'],
    ['What is the Science Universe?', 'creative-lab'],
    ['Who is Razib?', 'overview']
  ];
  for (const [q, want] of cases) assert.equal(ids(q)[0], want, q);
});

test('"won" finds every achievement through synonyms', () => {
  const got = ids('Which hackathons has he won?');
  for (const want of ['ach-legaltech', 'ach-aignite', 'ach-agentx']) assert.ok(got.includes(want), want);
});

test('Bangla questions find the right facts', () => {
  assert.equal(ids('রাজিব কোন বিশ্ববিদ্যালয়ে পড়ে?')[0], 'education');
  const awards = ids('তিনি কী কী পুরস্কার জিতেছেন?');
  for (const want of ['ach-legaltech', 'ach-aignite', 'ach-agentx']) assert.ok(awards.includes(want), want);
  const projects = ids('তার প্রজেক্টগুলো কী কী?');
  for (const want of ['project-dlas', 'project-fieldshift', 'project-kormopath', 'project-kotha', 'project-shasthogrid']) assert.ok(projects.includes(want), want);
});

test('a Bangla question that matches nothing still gets the overview to answer from', () => {
  assert.deepEqual(ids('আপনি কেমন আছেন?'), ['overview', 'contact']);
});
