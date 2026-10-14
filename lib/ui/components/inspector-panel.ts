import type {ActionInspectorProjection,CatalogInspectorProjection,DateInputProjection} from '../model/ui-projections';
import type {DeepReadonly} from '../model/types';

export type ActionDateValues=DeepReadonly<Pick<DateInputProjection,'dueDate'|'dueTime'|'deferDate'|'deferTime'>>;
export type ActionRelease=DeepReadonly<ActionInspectorProjection['releases'][number]>;
export type ActionTagChip=DeepReadonly<ActionInspectorProjection['tags'][number]>;

export interface ActionDetailsElements {
  readonly panel: HTMLElement;
  readonly heading: HTMLElement;
  readonly targetMissing: HTMLElement;
  readonly lifecycle: HTMLElement;
  readonly timestamps?: HTMLElement;
  readonly createdTimestamp?: HTMLElement;
  readonly updatedTimestamp?: HTMLElement;
  readonly flagged: HTMLButtonElement;
  readonly statusChoices: readonly HTMLButtonElement[];
  readonly fields: {
    readonly title: HTMLInputElement;
    readonly notes: HTMLTextAreaElement;
    readonly dueDate: HTMLInputElement;
    readonly dueTime: HTMLInputElement;
    readonly deferDate: HTMLInputElement;
    readonly deferTime: HTMLInputElement;
  };
  readonly savedCompare: HTMLElement;
  readonly dateSummary: HTMLElement;
  readonly releaseControls: HTMLElement;
  readonly projectSearch: HTMLInputElement;
  readonly tags: HTMLElement;
}

export interface ActionDetailsProps {
  readonly elements: ActionDetailsElements;
  readonly iconSvg: (name: string) => string;
  readonly view: DeepReadonly<Omit<ActionInspectorProjection,'dates'>> & {readonly dates: ActionDateValues};
  readonly setValue: (input: HTMLInputElement | HTMLTextAreaElement, value: unknown) => void;
  readonly renderClock: (input: HTMLInputElement) => void;
  readonly onRelease: (id: string) => void;
  readonly onRemoveTag: (id: string) => void;
}

export interface CatalogDetailsElements {
  readonly panel: HTMLElement;
  readonly discard: HTMLButtonElement;
  readonly heading: HTMLElement;
  readonly missing: HTMLElement;
  readonly name: HTMLInputElement;
  readonly nameError: HTMLElement;
  readonly description: HTMLTextAreaElement;
  readonly descriptionError: HTMLElement;
  readonly parent: HTMLElement;
  readonly problem: HTMLElement;
  readonly problemText: HTMLElement;
  readonly savedCompare: HTMLElement;
  readonly retry: HTMLButtonElement;
  readonly useMine: HTMLButtonElement;
  readonly useSaved: HTMLButtonElement;
}

export interface CatalogDetailsProps {
  readonly elements: CatalogDetailsElements;
  readonly view: DeepReadonly<CatalogInspectorProjection>;
  readonly setValue: (input: HTMLInputElement | HTMLTextAreaElement, value: unknown) => void;
  readonly fieldError: (id: string, controls: string[], text: string) => void;
}

export interface InspectorPanelElements {
  readonly actionPanel: HTMLElement;
  readonly catalogPanel: HTMLElement;
  readonly placeholder: HTMLElement;
  readonly workspace: HTMLElement;
}

export interface InspectorPanelProps {
  readonly elements: InspectorPanelElements;
  readonly action: ActionDetailsProps | null;
  readonly catalog: CatalogDetailsProps | null;
}

function button(
  document: Document,
  iconSvg: (name: string) => string,
  text: string,
  icon: string,
  onClick: () => void,
): HTMLButtonElement {
  const node = document.createElement('button');
  node.type = 'button';
  node.innerHTML = iconSvg(icon);
  const label = document.createElement('span');
  label.textContent = text;
  node.appendChild(label);
  node.onclick = onClick;
  return node;
}

export function ActionDetails(props: ActionDetailsProps): void {
  const {elements, view} = props;
  elements.heading.textContent = 'Action details';
  elements.targetMissing.hidden = view.targetAvailable;
  elements.targetMissing.textContent = view.missingMessage;
  elements.panel.dataset.targetAvailable = String(view.targetAvailable);

  elements.flagged.setAttribute('aria-pressed', String(view.flagged));
  for (const choice of elements.statusChoices) {
    choice.setAttribute('aria-pressed', String(choice.dataset.status === view.status));
  }

  props.setValue(elements.fields.title, view.title);
  props.setValue(elements.fields.notes, view.notes);
  for (const [field, value] of Object.entries(view.dates)) {
    const input = elements.fields[field as keyof ActionDateValues];
    if (value !== undefined) props.setValue(input, value);
    if (field === 'dueTime' || field === 'deferTime') props.renderClock(input as HTMLInputElement);
  }

  elements.savedCompare.textContent = view.savedCompare;
  elements.lifecycle.textContent = view.lifecycle;
  if (elements.timestamps) elements.timestamps.hidden = !view.timestamps;
  if (elements.createdTimestamp) elements.createdTimestamp.textContent = view.timestamps?.created || '—';
  if (elements.updatedTimestamp) elements.updatedTimestamp.textContent = view.timestamps?.updated || '—';
  elements.dateSummary.textContent = view.dateSummary;
  elements.releaseControls.replaceChildren();
  for (const release of view.releases) {
    elements.releaseControls.appendChild(
      button(elements.panel.ownerDocument, props.iconSvg, release.label, 'deferred', () =>
        props.onRelease(release.id),
      ),
    );
  }

  elements.projectSearch.placeholder = 'Unassigned';
  if (view.projectValue !== undefined) props.setValue(elements.projectSearch, view.projectValue);
  elements.tags.replaceChildren();
  for (const tag of view.tags) {
    const chip = button(elements.panel.ownerDocument, props.iconSvg, tag.label, 'close', () =>
      props.onRemoveTag(tag.id),
    );
    chip.dataset.focusKey = tag.focusKey;
    chip.setAttribute('aria-label', 'Remove Tag: ' + tag.label);
    elements.tags.appendChild(chip);
  }
}

export function CatalogDetails(props: CatalogDetailsProps): void {
  const {elements, view} = props;
  elements.discard.hidden = !view.temporary;
  elements.heading.textContent = view.kind === 'project' ? 'Project' : 'Tag';
  elements.missing.hidden = view.exists;
  elements.missing.textContent = view.missingMessage;
  elements.name.disabled = !view.exists;
  elements.description.disabled = !view.exists;
  if (view.draft) {
    props.setValue(elements.name, view.draft.name);
    props.setValue(elements.description, view.draft.description);
  }
  elements.parent.textContent = view.parentText;
  props.fieldError(elements.nameError.id, [elements.name.id], view.nameErrorText);
  props.fieldError(elements.descriptionError.id, [elements.description.id], view.descriptionErrorText);
  elements.problem.hidden = !view.conflict && !view.problemText;
  elements.problemText.textContent = view.conflict
    ? 'This ' + view.kind + ' changed elsewhere. Choose which edits to keep.'
    : view.problemText;
  elements.savedCompare.textContent = view.savedCompare;
  elements.useMine.hidden = !view.conflict;
  elements.useSaved.hidden = !view.conflict;
  elements.retry.hidden = !view.showRetry;
  elements.retry.disabled = view.retryDisabled;
}

export function InspectorPanel(props: InspectorPanelProps): void {
  const {elements, action, catalog} = props;
  const active = Boolean(action || catalog);
  elements.actionPanel.hidden = !action;
  elements.catalogPanel.hidden = !catalog;
  elements.placeholder.hidden = active;
  elements.workspace.classList.toggle('has-editor', active);
  if (action) ActionDetails(action);
  if (catalog) CatalogDetails(catalog);
}
