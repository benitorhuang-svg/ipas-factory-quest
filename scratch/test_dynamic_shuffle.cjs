function getOptionOrder(seedString) {
  let hash = 0;
  for (let i = 0; i < seedString.length; i++) {
    hash = (hash * 31 + seedString.charCodeAt(i)) >>> 0;
  }
  const random = () => {
    hash = (hash + 0x6D2B79F5) >>> 0;
    let t = Math.imul(hash ^ (hash >>> 15), 1 | hash);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const order = [0, 1, 2, 3];
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
}

const run1 = 'run-session-1';
const run2 = 'run-session-2';
const qId = 'L111-01';

const order1 = getOptionOrder(run1 + ':' + qId);
const order2 = getOptionOrder(run2 + ':' + qId);

console.log('Run 1 option order:', order1);
console.log('Run 2 option order:', order2);
console.assert(JSON.stringify(order1) !== JSON.stringify(order2), 'Different runs produce different option order');
console.assert(JSON.stringify(order1) === JSON.stringify(getOptionOrder(run1 + ':' + qId)), 'Same run is deterministic');
console.log('All tests passed!');
