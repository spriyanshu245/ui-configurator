import * as jsonpatch from 'fast-json-patch';

export function generateHumanDiff(original: object, patched: object) {
  const ops = jsonpatch.compare(original, patched);
  return ops.map(op => ({
    op: op.op,
    path: op.path,
    value: 'value' in op ? op.value : undefined,
    from: 'from' in op ? op.from : undefined
  }));
}
