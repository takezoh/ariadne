export type UiDiagnosticCounter=
 |'list.render'
 |'movement.fingerprint'
 |'movement.intent'
 |'movement.relevant'
 |'movement.target-groups';

export type UiDiagnosticPhase='snapshot.merge'|'view.render'|'dom.patch.rows';

export interface UiDiagnosticsPort {
 increment(counter:UiDiagnosticCounter):void;
 record(phase:UiDiagnosticPhase,durationMs:number):void;
}
