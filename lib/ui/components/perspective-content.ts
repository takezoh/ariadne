import type {PerspectiveCompletionLabel,PerspectiveView,PerspectiveViewItem} from '../model/perspective-view';

export interface PerspectiveGroupHeaderProps {
  readonly document: Document;
  readonly label: string;
  readonly count: number;
}

export interface PerspectiveActionCardProps {
  readonly document: Document;
  readonly item: PerspectiveViewItem;
  readonly view: PerspectiveView;
  readonly title: string;
  readonly notes: string;
  readonly badges: readonly string[];
  readonly active: boolean;
  readonly selected: boolean;
  readonly formattedTimestamp: string;
  readonly timezone: string;
  readonly onSelect: (event: MouseEvent) => void;
  readonly onSelectKeyDown: (event: KeyboardEvent) => void;
  readonly onComplete: () => void;
  readonly onToggleBody: () => void;
}

function labelForCompletion(label: PerspectiveCompletionLabel): string {
  return label === 'read' ? 'Mark read' : label === 'acknowledge' ? 'Acknowledge' : 'Complete';
}

function createButton(document: Document, text: string, className: string, onClick: () => void): HTMLButtonElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = className;
  button.textContent = text;
  button.onclick = onClick;
  return button;
}

function appendNoteText(parent: HTMLElement, notes: string): void {
  const matcher = /https?:\/\/[^\s<>"']+/g;
  let cursor = 0;
  for (const match of notes.matchAll(matcher)) {
    const raw = match[0];
    let end = raw.length;
    while (end > 0 && '.,!?;:)\]}'.includes(raw[end - 1])) end--;
    if (match.index > cursor) parent.appendChild(parent.ownerDocument.createTextNode(notes.slice(cursor, match.index)));
    if (end) {
      const url = raw.slice(0, end);
      const link = parent.ownerDocument.createElement('a');
      link.href = url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.textContent = url;
      parent.appendChild(link);
    }
    if (end < raw.length) parent.appendChild(parent.ownerDocument.createTextNode(raw.slice(end)));
    cursor = match.index + raw.length;
  }
  if (cursor < notes.length) parent.appendChild(parent.ownerDocument.createTextNode(notes.slice(cursor)));
}

export function PerspectiveGroupHeader(props: PerspectiveGroupHeaderProps): HTMLDivElement {
  const row = props.document.createElement('div');
  row.className = 'perspective-group';
  row.setAttribute('role', 'heading');
  row.setAttribute('aria-level', '3');
  const heading = props.document.createElement('strong');
  heading.textContent = props.label;
  const count = props.document.createElement('span');
  count.className = 'muted';
  count.textContent = String(props.count);
  row.appendChild(heading);
  row.appendChild(count);
  return row;
}

export function PerspectiveActionCard(props: PerspectiveActionCardProps): HTMLElement {
  const {document,item,view}=props;
  const action=item.action;
  const row=document.createElement('article');
  row.className='action-row perspective-card';
  row.dataset.actionId=action.id;
  row.dataset.occurrenceKey='perspective-action:'+action.id;
  row.setAttribute('role','listitem');
  row.setAttribute('aria-selected',String(props.selected));
  row.classList.toggle('selected',props.active);
  row.classList.toggle('batch-selected',props.selected);

  const complete=createButton(document,action.status==='completed'?'Completed':labelForCompletion(view.completion_label),'complete icon-button',props.onComplete);
  complete.className='complete perspective-completion';
  complete.setAttribute('role','checkbox');
  complete.setAttribute('aria-checked',String(action.status==='completed'));
  complete.setAttribute('aria-label',action.status==='completed'?'Completed: '+props.title:labelForCompletion(view.completion_label)+': '+props.title+'. Changes shared status to Completed.');
  complete.setAttribute('title','Changes shared status to Completed');
  complete.dataset.mutation='true';
  complete.setAttribute('aria-pressed',String(action.status==='completed'));
  complete.dataset.focusKey='complete:perspective-action:'+action.id;
  complete.disabled=action.status==='completed';

  const content=document.createElement('div');
  content.className='row-content';
  const select=document.createElement('button');
  select.type='button';
  select.className='action-select';
  select.textContent=props.title;
  select.onclick=props.onSelect;
  select.dataset.focusKey='select:perspective-action:'+action.id;
  select.onkeydown=props.onSelectKeyDown;
  select.setAttribute('aria-pressed',String(props.active));
  const badgeList=document.createElement('div');
  badgeList.className='badges';
  for(const text of props.badges){const badge=document.createElement('span');badge.className='badge';badge.textContent=text;badgeList.appendChild(badge);}
  content.appendChild(select);
  content.appendChild(badgeList);

  if(view.type==='timeline'){
    const timestamp=document.createElement('p');
    timestamp.className='perspective-timestamp';
    const meaning=view.timestamp==='created_at'?'Registration':'Last update';
    timestamp.textContent=meaning+': '+(props.formattedTimestamp||'Unknown '+meaning.toLowerCase())+' ('+props.timezone+')';
    content.appendChild(timestamp);
  }

  if(view.type==='tasklist'){
    if(view.show_notes&&props.notes){const preview=document.createElement('p');preview.className='perspective-notes';preview.textContent=previewText(props.notes);content.appendChild(preview);}
  }else{
    const expanded=item.expanded;
    const toggle=createButton(document,expanded?'Collapse notes':'Read notes', 'perspective-body-toggle',props.onToggleBody);
    toggle.setAttribute('aria-expanded',String(expanded));
    toggle.dataset.focusKey='body:'+action.id;
    content.appendChild(toggle);
    if(expanded){
      const body=document.createElement('div');
      body.className='perspective-notes';
      body.style.whiteSpace='pre-wrap';
      body.style.overflowWrap='anywhere';
      appendNoteText(body,props.notes);
      if(!props.notes)body.textContent='No notes';
      content.appendChild(body);
    }else if(props.notes){
      const preview=document.createElement('p');
      preview.className='perspective-notes';
      preview.textContent=previewText(props.notes);
      content.appendChild(preview);
    }
  }

  row.appendChild(complete);
  row.appendChild(content);
  return row;
}

function previewText(notes:string):string {
  let codepoints=0,end=0;
  for(const character of notes){if(codepoints===280)return notes.slice(0,end)+'…';codepoints++;end+=character.length;}
  return notes;
}
