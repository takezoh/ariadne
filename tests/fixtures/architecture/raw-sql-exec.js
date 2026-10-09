// Negative fixture: unrestricted exec outside the reviewed adapter module.
export function unsafe(db, statement) {
  return db.exec(statement);
}
