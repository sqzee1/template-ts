export type MutableData = Record<string, unknown>;

export type Migration = (data: MutableData) => void;

export const migrations: readonly Migration[] = [];

export const DATA_VERSION = migrations.size();

export const enum MigrationStatus {
  UpToDate,
  Migrated,
  FromFuture,
}

export function migrate(data: MutableData): MigrationStatus {
  const version = typeIs(data.Version, "number") ? data.Version : 0;

  if (version > DATA_VERSION) return MigrationStatus.FromFuture;
  if (version === DATA_VERSION) return MigrationStatus.UpToDate;

  for (let index = version; index < DATA_VERSION; index++) migrations[index](data);
  data.Version = DATA_VERSION;

  return MigrationStatus.Migrated;
}
