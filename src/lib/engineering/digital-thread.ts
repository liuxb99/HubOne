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

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  return value as Record<string, unknown>;
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

export function parseDigitalThread(value: unknown): DigitalThreadSnapshot {
  const root = asRecord(value);
  if (root.schema_version !== "1.0") {
    throw new Error(`Unsupported digital thread schema: ${String(root.schema_version ?? "missing")}`);
  }
  if (!Array.isArray(root.entities) || !Array.isArray(root.relations)) {
    throw new Error("Digital thread entities and relations are required");
  }

  const entities = root.entities.map((item, index) => {
    const entity = asRecord(item);
    const id = asString(entity.id);
    const kind = asString(entity.kind);
    const name = asString(entity.name);
    if (!id || !kind || !name) {
      throw new Error(`Invalid digital thread entity at index ${index}`);
    }
    return { id, kind, name, properties: asRecord(entity.properties) };
  });

  const relations = root.relations.map((item, index) => {
    const relation = asRecord(item);
    const id = asString(relation.id);
    const from = asString(relation.from);
    const to = asString(relation.to);
    const kind = asString(relation.kind);
    if (!id || !from || !to || !kind) {
      throw new Error(`Invalid digital thread relation at index ${index}`);
    }
    return { id, from, to, kind };
  });

  return { schema_version: "1.0", entities, relations };
}

export function buildDigitalThreadView(snapshot: DigitalThreadSnapshot): DigitalThreadView {
  const object = snapshot.entities.find((entity) => entity.kind === "engineering_object");
  const tools: DigitalThreadView["tools"] = [];
  const artifacts: DigitalThreadView["artifacts"] = [];
  let esmId = "";
  let ifcGuid = "";

  for (const entity of snapshot.entities) {
    if (entity.kind === "tool_execution") {
      const data = asRecord(entity.properties.data);
      esmId ||= asString(data.esm_id);
      ifcGuid ||= asString(data.ifc_guid);
      tools.push({
        requestId: asString(entity.properties.request_id),
        toolId: asString(entity.properties.tool_id),
        status: asString(entity.properties.status),
      });
    }
    if (entity.kind === "artifact") {
      artifacts.push({
        id: asString(entity.properties.artifact_id),
        type: asString(entity.properties.artifact_type),
        path: asString(entity.properties.path),
        sha256: asString(entity.properties.sha256),
      });
    }
  }

  return {
    subject: object?.name ?? "engineering_work",
    esmId: esmId || undefined,
    ifcGuid: ifcGuid || undefined,
    tools,
    artifacts,
    relations: snapshot.relations,
  };
}
