import { describe, expect, it } from "vitest";

import { buildDigitalThreadView, parseDigitalThread } from "./digital-thread";

const snapshot = {
  schema_version: "1.0",
  entities: [
    { id: "object-1", kind: "engineering_object", name: "rc_column", properties: {} },
    {
      id: "exec-1",
      kind: "tool_execution",
      name: "req-1",
      properties: {
        request_id: "req-1",
        tool_id: "forge.rc-column",
        status: "succeeded",
        data: { esm_id: "column-1", ifc_guid: "ifc-guid-1" },
      },
    },
    {
      id: "artifact-1",
      kind: "artifact",
      name: "calculation:rc-column:column-1",
      properties: {
        artifact_id: "calculation:rc-column:column-1",
        artifact_type: "calculation_trace",
        path: "calc.json",
        sha256: "a".repeat(64),
      },
    },
  ],
  relations: [
    { id: "relation-1", from: "object-1", to: "artifact-1", kind: "has_calculation" },
  ],
};

describe("digital thread", () => {
  it("parses and builds a portal view", () => {
    const view = buildDigitalThreadView(parseDigitalThread(snapshot));
    expect(view.subject).toBe("rc_column");
    expect(view.esmId).toBe("column-1");
    expect(view.ifcGuid).toBe("ifc-guid-1");
    expect(view.tools[0].toolId).toBe("forge.rc-column");
    expect(view.artifacts[0].type).toBe("calculation_trace");
  });

  it("rejects unsupported schema", () => {
    expect(() => parseDigitalThread({ ...snapshot, schema_version: "2.0" })).toThrow(
      "Unsupported digital thread schema",
    );
  });
});
