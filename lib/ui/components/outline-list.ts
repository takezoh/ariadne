import type {UiActionRecord,ProjectedActionRow,projectCatalogRow} from '../model/ui-projections';
import type {DeepReadonly} from '../model/types';
import {PerspectiveActionCard,PerspectiveGroupHeader,type PerspectiveActionCardProps} from './perspective-content';

export type ActionRecord=DeepReadonly<Pick<UiActionRecord,'id'|'title'|'status'|'parent_id'|'flagged'>>;

export interface ActionOutlineEntry {
  readonly kind: 'action';
  readonly key: string;
  readonly id: string;
  readonly action: ActionRecord;
  readonly level: number;
  readonly catalogId?: string | null;
  readonly perspective?: PerspectiveActionCardProps;
  readonly perspectiveSignature?: string;
  readonly tasklistPerspective?: {completionLabel:'complete'|'read'|'acknowledge';notesPreview?:string};
}

export interface CatalogOutlineEntry {
  readonly kind: 'project' | 'tag' | 'group';
  readonly key: string;
  readonly id: string;
  readonly level: number;
  readonly label: string;
  readonly expandable: boolean;
}

export interface PerspectiveGroupEntry {
  readonly kind: 'perspective-group';
  readonly key: string;
  readonly label: string;
  readonly count: number;
}

export type OutlineEntry = ActionOutlineEntry | CatalogOutlineEntry | PerspectiveGroupEntry;

export type RowBadge=DeepReadonly<ProjectedActionRow['badges'][number]>;

const pointerDownHandlers = new WeakMap<HTMLElement, (event: PointerEvent) => void>();

function setPointerDown(
  element: HTMLElement,
  handler: ((event: PointerEvent) => void) | undefined,
): void {
  const previous = pointerDownHandlers.get(element);
  if (previous) element.removeEventListener('pointerdown', previous);
  if (handler) {
    element.addEventListener('pointerdown', handler);
    pointerDownHandlers.set(element, handler);
  } else {
    pointerDownHandlers.delete(element);
  }
}

export interface ActionRowProps extends DeepReadonly<Omit<ProjectedActionRow,'signature'>> {
  readonly document: Document;
  readonly iconSvg: (name: string) => string;
  readonly entry: ActionOutlineEntry;
  readonly mutationBlocked: boolean;
  readonly onComplete: () => void;
  readonly onSelect: (event: MouseEvent) => void;
  readonly onSelectKeyDown: (event: KeyboardEvent) => void;
  readonly onFlag: () => void;
  readonly onGripPointerDown: (event: PointerEvent) => void;
  readonly onGripKeyDown: (event: KeyboardEvent) => void;
  readonly onRowPointerDown: (event: PointerEvent) => void;
  readonly onRowClick: (event: MouseEvent) => void;
  readonly onDragStart: (event: DragEvent) => void;
  readonly reorderEnabled?: boolean;
  readonly completionLabel?: 'complete' | 'read' | 'acknowledge';
  readonly notesPreview?: string;
}

export interface CatalogRowProps extends DeepReadonly<Omit<ReturnType<typeof projectCatalogRow>,'signature'>> {
  readonly document: Document;
  readonly iconSvg: (name: string) => string;
  readonly entry: CatalogOutlineEntry;
  readonly onToggle: () => void;
  readonly onSelect: () => void;
  readonly onSelectKeyDown: (event: KeyboardEvent) => void;
  readonly onPointerDown: (event: PointerEvent) => void;
  readonly onDragStart: (event: DragEvent) => void;
}

function createButton(
  document: Document,
  iconSvg: (name: string) => string,
  text: string,
  icon: string,
  onClick: (() => void) | ((event: MouseEvent) => void),
): HTMLButtonElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.innerHTML = iconSvg(icon);
  const label = document.createElement('span');
  label.textContent = text;
  button.appendChild(label);
  button.onclick = onClick as (this: GlobalEventHandlers, event: MouseEvent) => unknown;
  return button;
}

export function ActionRow(props: ActionRowProps): HTMLDivElement {
  const {document, iconSvg, entry, title, accessibleTitle, badges} = props;
  const action = entry.action;
  const row = document.createElement('div');
  row.className = 'action-row';
  row.dataset.actionId = action.id;
  row.dataset.occurrenceKey = entry.key;
  row.draggable = props.reorderEnabled !== false;
  row.ondragstart = event => {if(props.reorderEnabled===false)event.preventDefault();else props.onDragStart(event);};
  row.setAttribute('role', 'treeitem');
  row.setAttribute('aria-level', String(entry.level + 1));
  row.setAttribute('aria-selected', String(props.batchSelected));
  row.classList.toggle('selected', props.active);
  row.classList.toggle('batch-selected', props.batchSelected);
  row.style.setProperty('--depth', String(entry.level));

  const complete = createButton(
    document,
    iconSvg,
    action.status === 'completed' ? 'Completed' : props.completionLabel==='read'?'Mark read':props.completionLabel==='acknowledge'?'Acknowledge':'Complete',
    action.status === 'completed' ? 'checked' : 'circle',
    props.onComplete,
  );
  complete.className = props.completionLabel ? 'complete perspective-completion' : 'complete icon-button';
  complete.setAttribute('role', 'checkbox');
  complete.setAttribute('aria-checked', String(action.status === 'completed'));
  complete.setAttribute(
    'aria-label',
    action.status === 'completed' ? 'Completed: '+accessibleTitle : (props.completionLabel==='read'?'Mark read: ':props.completionLabel==='acknowledge'?'Acknowledge: ':'Complete: ')+accessibleTitle+'. Changes shared status to Completed.',
  );
  complete.title='Changes shared status to Completed';
  if(props.completionLabel)complete.querySelector('svg')?.remove();
  complete.dataset.mutation = 'true';
  complete.disabled = action.status === 'completed' || props.mutationBlocked;
  complete.dataset.focusKey = 'complete:' + entry.key;

  const select = createButton(document, iconSvg, title, 'chevron', props.onSelect);
  select.className = 'action-select';
  select.classList.toggle('untitled', action.title === '');
  select.onkeydown = props.onSelectKeyDown;
  select.setAttribute('aria-pressed', String(props.active));
  select.dataset.focusKey = 'select:' + entry.key;

  const labelList = document.createElement('div');
  labelList.className = 'badges';
  for (const badge of badges) {
    const label = document.createElement('span');
    label.className = 'badge' + (badge.icon ? ' on-hold' : '');
    if (badge.icon) label.innerHTML = iconSvg(badge.icon);
    label.appendChild(document.createTextNode(badge.text));
    labelList.appendChild(label);
  }
  const content = document.createElement('div');
  content.className = 'row-content';
  content.appendChild(select);
  content.appendChild(labelList);
  if(props.notesPreview){const notes=document.createElement('p');notes.className='perspective-notes';notes.textContent=props.notesPreview;content.appendChild(notes);}

  const flag = createButton(
    document,
    iconSvg,
    action.flagged ? 'Remove flag' : 'Flag action',
    'flagged',
    props.onFlag,
  );
  flag.className = 'flag icon-button';
  flag.setAttribute('aria-label', (action.flagged ? 'Remove flag: ' : 'Flag action: ') + accessibleTitle);
  flag.setAttribute('aria-pressed', String(action.flagged));
  flag.dataset.mutation = 'true';
  flag.dataset.focusKey = 'flag:' + entry.key;

  const grip = createButton(document, iconSvg, 'Move action', 'grip', () => {});
  grip.className = 'drag-handle icon-button';
  grip.setAttribute('aria-label', 'Move: ' + accessibleTitle);
  grip.dataset.actionId = action.id;
  grip.dataset.focusKey = 'grip:' + entry.key;
  grip.hidden=props.reorderEnabled===false;
  if(props.reorderEnabled!==false){setPointerDown(grip, props.onGripPointerDown);grip.onkeydown = props.onGripKeyDown;}

  setPointerDown(row, props.reorderEnabled===false?undefined:props.onRowPointerDown);
  row.onclick = props.onRowClick;
  row.appendChild(grip);
  row.appendChild(complete);
  row.appendChild(content);
  row.appendChild(flag);
  return row;
}

export function CatalogRow(props: CatalogRowProps): HTMLDivElement {
  const {document, iconSvg, entry} = props;
  const row = document.createElement('div');
  row.className = 'catalog-row';
  row.dataset.catalogKind = entry.kind;
  row.dataset.catalogId = entry.id;
  row.dataset.outlineKey = entry.key;
  row.setAttribute('aria-selected', String(props.selected));
  row.style.setProperty('--depth', String(entry.level));
  row.setAttribute('role', 'treeitem');
  row.setAttribute('aria-level', String(entry.level + 1));
  row.classList.toggle('selected', props.selected);

  const toggle = createButton(
    document,
    iconSvg,
    props.collapsed ? 'Expand' : 'Collapse',
    'chevron',
    props.onToggle,
  );
  toggle.className = 'tree-toggle';
  toggle.setAttribute('aria-label', (props.collapsed ? 'Expand ' : 'Collapse ') + entry.label);
  toggle.setAttribute('aria-expanded', String(!props.collapsed));
  toggle.hidden = !entry.expandable;
  toggle.dataset.focusKey = 'expand:' + entry.key;

  const icon = entry.kind === 'project' ? 'projects' : entry.kind === 'tag' ? 'tags' : 'normal';
  const select = createButton(document, iconSvg, props.title, icon, props.onSelect);
  select.className = 'catalog-select';
  select.dataset.focusKey = entry.key;
  select.onkeydown = props.onSelectKeyDown;

  if (entry.kind !== 'group') {
    row.draggable = true;
    setPointerDown(row, props.onPointerDown);
    row.ondragstart = props.onDragStart;
  }
  row.appendChild(toggle);
  row.appendChild(select);
  return row;
}

function patchNode(current: Node, next: Node): Node {
  if (current.nodeType !== next.nodeType || current.nodeName !== next.nodeName) {
    current.parentNode?.replaceChild(next, current);
    return next;
  }
  if (current.nodeType === 3) {
    if (current.nodeValue !== next.nodeValue) current.nodeValue = next.nodeValue;
    return current;
  }

  const currentElement = current as HTMLElement;
  const nextElement = next as HTMLElement;
  for (const attribute of [...currentElement.attributes]) {
    if (!nextElement.hasAttribute(attribute.name)) currentElement.removeAttribute(attribute.name);
  }
  for (const attribute of [...nextElement.attributes]) {
    if (currentElement.getAttribute(attribute.name) !== attribute.value) {
      currentElement.setAttribute(attribute.name, attribute.value);
    }
  }
  for (const name of ['onclick', 'onkeydown', 'ondragstart'] as const) {
    currentElement[name] = nextElement[name] as never;
  }
  setPointerDown(currentElement, pointerDownHandlers.get(nextElement));
  const children = [...next.childNodes];
  for (let index = 0; index < children.length; index++) {
    const child = current.childNodes[index];
    if (child) patchNode(child, children[index]);
    else current.appendChild(children[index]);
  }
  while (current.childNodes.length > children.length) {
    const last = current.lastChild;
    if (last) current.removeChild(last);
  }
  return current;
}

function reconcileRows(container: HTMLElement, desired: HTMLElement[]): boolean {
  const retained = new Set(desired);
  let changed = false;
  for (const current of [...container.children]) {
    if (!retained.has(current as HTMLElement)) {
      current.remove();
      changed = true;
    }
  }
  for (let index = 0; index < desired.length; index++) {
    const current = container.children[index] || null;
    if (current !== desired[index]) {
      container.insertBefore(desired[index], current);
      changed = true;
    }
  }
  return changed;
}

export interface OutlineListProps {
  readonly container: HTMLElement;
  readonly entries: readonly OutlineEntry[];
  readonly stable: boolean;
  readonly tree: boolean;
  readonly emptyLabel: string | null;
  readonly rowNodes: Map<string, HTMLElement>;
  readonly rowSignatures: Map<string, string>;
  readonly emptyRow: HTMLDivElement | null;
  readonly signatureFor: (entry: OutlineEntry) => string;
  readonly actionPropsFor: (entry: ActionOutlineEntry) => ActionRowProps;
  readonly catalogPropsFor: (entry: CatalogOutlineEntry) => CatalogRowProps;
  readonly now?: () => number;
  readonly recordRows?: (duration: number) => void;
}

export interface OutlineListResult {
  readonly rowNodes: Map<string, HTMLElement>;
  readonly rowSignatures: Map<string, string>;
  readonly emptyRow: HTMLDivElement | null;
  readonly changed: boolean;
}

export function OutlineList(props: OutlineListProps): OutlineListResult {
  const {
    container,
    entries,
    stable,
    tree,
    emptyLabel,
    rowNodes,
    rowSignatures,
    emptyRow: previousEmptyRow,
  } = props;
  container.setAttribute('role', tree ? 'tree' : 'list');
  if (stable) return {rowNodes, rowSignatures, emptyRow: previousEmptyRow, changed: false};
  const nextRows = new Map<string, HTMLElement>();
  const nextSignatures = new Map<string, string>();
  const desiredRows: HTMLElement[] = [];
  let contentChanged = false;

  for (const entry of entries) {
    const signature = props.signatureFor(entry);
    const existing = rowNodes.get(entry.key);
    if (existing && rowSignatures.get(entry.key) === signature) {
      desiredRows.push(existing);
      nextRows.set(entry.key, existing);
      nextSignatures.set(entry.key, signature);
      continue;
    }
    const next =
      entry.kind === 'action'
        ? entry.perspective ? PerspectiveActionCard(entry.perspective) : ActionRow(props.actionPropsFor(entry))
        : entry.kind === 'perspective-group'
          ? PerspectiveGroupHeader({document:container.ownerDocument,label:entry.label,count:entry.count})
          : CatalogRow(props.catalogPropsFor(entry));
    const row = existing ? patchNode(existing, next) as HTMLElement : next;
    desiredRows.push(row);
    nextRows.set(entry.key, row);
    nextSignatures.set(entry.key, signature);
    contentChanged = true;
  }

  let nextEmptyRow = previousEmptyRow;
  if (!entries.some((entry) => entry.kind === 'action') && emptyLabel) {
    if (!nextEmptyRow) {
      nextEmptyRow = container.ownerDocument.createElement('div');
      nextEmptyRow.className = 'empty';
      contentChanged = true;
    }
    if (nextEmptyRow.textContent !== emptyLabel) {
      nextEmptyRow.textContent = emptyLabel;
      contentChanged = true;
    }
    desiredRows.push(nextEmptyRow);
  } else {
    nextEmptyRow = null;
  }

  const started = props.recordRows && props.now ? props.now() : null;
  const structureChanged = reconcileRows(container, desiredRows);
  if (started !== null) props.recordRows?.(props.now!() - started);
  return {
    rowNodes: nextRows,
    rowSignatures: nextSignatures,
    emptyRow: nextEmptyRow,
    changed: contentChanged || structureChanged,
  };
}
