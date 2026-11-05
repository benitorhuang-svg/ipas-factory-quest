// All embedded HTML locations share the same math renderer and verification.
export function htmlFields(payload) {
  return [
    { owner: payload, key: 'details' },
    ...Object.values(payload.questions || {}).map(owner => ({ owner, key: 'details' })),
    ...Object.values(payload.notes || {}).map(owner => ({ owner, key: 'html' })),
  ];
}
