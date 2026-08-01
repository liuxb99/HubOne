export type DigitalThreadEntity = {
  id: string;
  kind: string;
  name: string;
  properties: Record<string, unknown>;
};

export type DigitalThreadRelation = {
  id: string;
  from: string;
  to: string;
  kind: string;
};

export type DigitalThreadSnapshot = {
  schema_version: "1.0";
  entities: DigitalThreadEntity[];
  relations: DigitalThreadRelation[];
};

export type DigitalThreadView = {
  subject: string;
  esmId?: string;
  ifcGuid?: string;
  tools: Array<{ requestId: string; toolId: string; status: string }>;
  artifacts: Array<{ id: string; type: string; path: string; sha256: string }>;
  relations: DigitalThreadRelation[];
};

const SHA256_PATTERN = /^[a-f0-9]{64}$/i;

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  return value as Record<string, unknown>;
}

function requiredString(value: unknown, path: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${path} must be a non-empty string`);
  }
  return value.trim();
}

function optionalString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() !== "" ? value.trim() : undefined;
}

function assertUnique(id: string, seen: Set<string>, path: string): void {
  if (seen.has(id)) {
    throw new Error(`Duplicate ${path} id: ${id}`);
  }
  seen.add(id);
}

export function parseDigitalThread(value: unknown): DigitalThreadSnapshot {
  const root = asRecord(value);
  if (root.schema_version !== "1.0") {
    throw new Error(
      `Unsupported digital thread schema: ${String(root.schema_version ?? "missing")}`,
    );
  }
  if (!Array.isArray(root.entities) || !Array.isArray(root.relations)) {
    throw new Error("Digital thread entities and relations are required");
  }

  const entityIds = new Set<string>();
  const entities = root.entities.map((item, index) => {
    const entity = asRecord(item);
    const id = requiredString(entity.id, `entities[${index}].id`);
    assertUnique(id, entityIds, "entity");
    return {
      id,
      kind: requiredString(entity.kind, `entities[${index}].kind`),
      name: requiredString(entity.name, `entities[${index}].name`),
      properties: asRecord(entity.properties),
    };
  });

  const relationIds = new Set<string>();
  const relations = root.relations.map((item, index) => {
    const relation = asRecord(item);
    const id = requiredString(relation.id, `relations[${index}].id`);
    assertUnique(id, relationIds, "relation");
    const from = requiredString(relation.from, `relations[${index}].from`);
    const to = requiredString(relation.to, `relations[${index}].to`);
    if (!entityIds.has(from) || !entityIds.has(to)) {
      throw new Error(`Relation ${id} references an unknown entity`);
    }
    return {
      id,
      from,
      to,
      kind: requiredString(relation.kind, `relations[${index}].kind`),
    };
  });

  return { schema_version: "1.0", entities, relations };
}

export function buildDigitalThreadView(snapshot: DigitalThreadSnapshot): DigitalThreadView {
  const object = snapshot.entities.find((entity) => entity.kind === "engineering_object");
  const tools: DigitalThreadView["tools"] = [];
  const artifacts: DigitalThreadView["artifacts"] = [];
  let esmId: string | undefined;
  let ifcGuid: string | undefined;

  for (const entity of snapshot.entities) {
    if (entity.kind === "tool_execution") {
      const data = asRecord(entity.properties.data);
      esmId ??= optionalString(data.esm_id);
      ifcGuid ??= optionalString(data.ifc_guid);
      tools.push({
        requestId: requiredString(entity.properties.request_id, `${entity.id}.request_id`),
        toolId: requiredString(entity.properties.tool_id, `${entity.id}.tool_id`),
        status: requiredString(entity.properties.status, `${entity.id}.status`),
      });
    }

    if (entity.kind === "artifact") {
      const id = requiredString(entity.properties.artifact_id, `${entity.id}.artifact_id`);
      const type = requiredString(
        entity.properties.artifact_type,
        `${entity.id}.artifact_type`,
      );
      const path = requiredString(entity.properties.path, `${entity.id}.path`);
      const sha256 = requiredString(entity.properties.sha256, `${entity.id}.sha256`);
      if (!SHA256_PATTERN.test(sha256)) {
        throw new Error(`${entity.id}.sha256 must be a 64-character SHA-256 digest`);
      }
      artifacts.push({ id, type, path, sha256: sha256.toLowerCase() });
    }
  }

  return {
    subject: object?.name ?? "engineering_work",
    esmId,
    ifcGuid,
    tools,
    artifacts,
    relations: snapshot.relations,
  };
}
