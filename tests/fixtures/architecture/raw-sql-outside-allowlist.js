// Negative fixture: raw SQL outside the reviewed adapter module.
export function unsafe(db, name) {
  return db.prepare('SELECT * FROM ' + name);
}
