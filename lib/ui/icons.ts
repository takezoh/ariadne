/** Original 24px line icons, generated from this small consistent path vocabulary. */
export function iconSvg(name:string):string {
 const paths:Record<string,string>={
  tick:'<path d="m5 12 4 4 10-10"/>',
  filters:'<path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="2"/><circle cx="15" cy="17" r="2"/>',
  grip:'<circle cx="9" cy="5" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="19" r="1"/>',
  selection:'<rect x="5" y="5" width="14" height="14" rx="3"/>',
  selected:'<rect x="5" y="5" width="14" height="14" rx="3"/><path d="m8 12 3 3 5-6"/>',
  projects:'<path d="M3 7V5h7l2 2h9v12H3z"/>',
  tags:'<path d="M3 4h8l10 10-7 7L3 10z"/><circle cx="7" cy="8" r="1"/>',
  history:'<path d="M4 5v5h5M4 10a8 8 0 1 1 0 5M12 7v5l3 2"/>',
  perspective:'<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M9 3v18M9 9h12"/>',
  circle:'<circle cx="12" cy="12" r="8"/>',
  checked:'<circle cx="12" cy="12" r="8"/><path d="m8 12 3 3 5-6"/>',
  back:'<path d="m11 5-7 7 7 7M4 12h16"/>',
  close:'<path d="m6 6 12 12M18 6 6 18"/>',
  inbox:'<path d="M4 5h16v14H4zM4 13h5l2 3h2l2-3h5"/>',
  normal:'<path d="M8 6h12M8 12h12M8 18h12"/><circle cx="3" cy="6" r=".7"/><circle cx="3" cy="12" r=".7"/><circle cx="3" cy="18" r=".7"/>',
  flagged:'<path d="M5 21V4m0 1h13l-3 4 3 4H5"/>',
  waiting:'<path d="M8 5v14m8-14v14"/>',
  deferred:'<circle cx="12" cy="12" r="8"/><path d="M12 7v5l3 2"/>',
  completed:'<path d="m5 12 4 4L19 6"/>',
  cancelled:'<path d="M5 7h14M9 7V4h6v3M7 7l1 13h8l1-13M10 11v5m4-5v5"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',
  refresh:'<path d="M20 7v5h-5M4 17v-5h5M19 9a7 7 0 0 0-12-3L4 9m1 6a7 7 0 0 0 12 3l3-3"/>',
  expand:'<path d="M9 4H4v5m11-5h5v5M4 15v5h5m11-5v5h-5"/>',
  collapse:'<path d="M4 9h5V4m11 5h-5V4M9 20v-5H4m11 5v-5h5"/>',
  undo:'<path d="M8 5 3 10l5 5M3 10h10a7 7 0 0 1 7 7"/>',
  chevron:'<path d="m9 5 7 7-7 7"/>',
  edit:'<path d="m5 15 10-10 4 4L9 19l-5 1zM13 7l4 4"/>',
 };
 return `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${paths[name]??paths.normal}</svg>`;
}
