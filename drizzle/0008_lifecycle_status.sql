-- One-time lifecycle rename. Runtime accepts only the new status values.
UPDATE tasks SET status=CASE status
 WHEN 'waiting' THEN 'on-hold'
 WHEN 'done' THEN 'completed'
 WHEN 'cancelled' THEN 'dropped'
 ELSE status END;
--> statement-breakpoint
-- Retired payloads/deltas are discarded, without runtime compatibility.
-- Owner revision restarts at zero; fresh requests must use fresh operation IDs.
DELETE FROM operations;
--> statement-breakpoint
-- Keep deleted catalog ID reservations in the new revision epoch.
UPDATE catalog_identity_ledger SET revision=0;
