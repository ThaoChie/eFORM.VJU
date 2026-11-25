/**
 * Trích xuất danh sách trường dữ liệu và cấu hình chữ ký từ templateLayoutJson
 * Hỗ trợ cả 3 định dạng:
 * 1. Mảng CRITERIA_GROUP kèm children (Chuẩn DRL VJU)
 * 2. Đối tượng { blocks: [...] }
 * 3. Đối tượng { fields: [...] }
 */

export const normalizeTreeNode = (rawItem, allFieldCodes = [], parentCode = null) => {
  const code = rawItem.fieldCode || rawItem.code || rawItem.id || "";
  const master = allFieldCodes.find((af) => af.fieldCode === code);

  const rawDataType = rawItem.dataType || master?.dataType || "NUMBER";
  const isClass =
    rawItem.isClass ||
    rawDataType === "OBJECT" ||
    rawDataType === "ARRAY" ||
    rawItem.type === "CRITERIA_GROUP" ||
    rawItem.category === "CRITERIA_GROUP" ||
    (Array.isArray(rawItem.children) && rawItem.children.length > 0);

  const classType = isClass
    ? rawItem.classType || (rawDataType === "ARRAY" ? "ARRAY" : "OBJECT")
    : null;

  const dataType = isClass ? (classType === "ARRAY" ? "ARRAY" : "OBJECT") : rawDataType;

  let children = [];
  if (Array.isArray(rawItem.children) && rawItem.children.length > 0) {
    children = rawItem.children.map((child) =>
      normalizeTreeNode(child, allFieldCodes, code)
    );
  }

  return {
    id: rawItem.id || code || `node_${Math.random().toString(36).substring(2, 9)}`,
    fieldCode: code,
    fieldName: rawItem.fieldName || rawItem.name || rawItem.title || master?.fieldName || code,
    dataType,
    category: rawItem.category || master?.category || (isClass ? "CLASS" : "COMMON"),
    isRequired: !!(rawItem.isRequired ?? master?.isRequired),
    isClass: !!isClass,
    classType,
    parentCode,
    effectiveFrom: rawItem.effectiveFrom || "",
    effectiveTo: rawItem.effectiveTo || "",
    isActive: rawItem.isActive !== false,
    itemType: rawItem.itemType || "OBJECT",
    min: rawItem.min !== undefined ? rawItem.min : 0,
    max: rawItem.max !== undefined ? rawItem.max : null,
    renderCondition: rawItem.renderCondition || "",
    validationRules: Array.isArray(rawItem.validationRules)
      ? rawItem.validationRules
      : rawItem.validationRules
      ? [rawItem.validationRules]
      : [],
    changeReason: rawItem.changeReason || "",
    children,
  };
};

/**
 * Đếm số lượng trường nguyên tử và số lượng lớp trong danh sách / cây
 */
export const countTreeStats = (items = []) => {
  let atomicCount = 0;
  let classCount = 0;

  const walk = (nodes) => {
    if (!Array.isArray(nodes)) return;
    nodes.forEach((node) => {
      if (node.isClass || node.dataType === "OBJECT" || node.dataType === "ARRAY") {
        classCount++;
      } else {
        atomicCount++;
      }
      if (Array.isArray(node.children) && node.children.length > 0) {
        walk(node.children);
      }
    });
  };

  walk(items);
  return { atomicCount, classCount, totalCount: atomicCount + classCount };
};

/**
 * Làm phẳng cây node thành danh sách flat
 */
export const flattenTree = (tree = []) => {
  const result = [];
  const walk = (nodes) => {
    if (!Array.isArray(nodes)) return;
    nodes.forEach((n) => {
      result.push(n);
      if (Array.isArray(n.children) && n.children.length > 0) {
        walk(n.children);
      }
    });
  };
  walk(tree);
  return result;
};

/**
 * Trích xuất danh sách cấu trúc cây và thông tin layout từ template
 */
export const extractTreeFromTemplate = (template, allFieldCodes = []) => {
  if (!template) {
    return { tree: [], signatureSlots: null, rawLayout: "", scope: null };
  }

  const rawJson = template.templateLayoutJson;
  let layout = null;
  try {
    layout = typeof rawJson === "string" ? JSON.parse(rawJson) : rawJson;
  } catch (e) {
    console.warn("Lỗi parse templateLayoutJson:", e);
  }

  let tree = [];
  let signatureSlots = null;
  let scope = null;

  if (Array.isArray(layout)) {
    // Định dạng 1: Mảng khối tiêu chí (CRITERIA_GROUP)
    tree = layout.map((group) => {
      const groupCode = group.fieldCode || group.id || "group";
      const normalizedChildren = Array.isArray(group.children)
        ? group.children.map((child) => normalizeTreeNode(child, allFieldCodes, groupCode))
        : [];
      return {
        id: group.id || groupCode,
        fieldCode: groupCode,
        fieldName: group.title || group.name || groupCode,
        dataType: "OBJECT",
        category: "CRITERIA_GROUP",
        isRequired: !!group.isRequired,
        isClass: true,
        classType: "OBJECT",
        effectiveFrom: group.effectiveFrom || "",
        effectiveTo: group.effectiveTo || "",
        isActive: group.isActive !== false,
        renderCondition: group.renderCondition || "",
        validationRules: group.validationRules || [],
        changeReason: group.changeReason || "",
        children: normalizedChildren,
      };
    });
  } else if (layout && typeof layout === "object") {
    scope = layout.scope;
    if (Array.isArray(layout.signatureSlots)) {
      signatureSlots = layout.signatureSlots;
    }

    if (Array.isArray(layout.fields)) {
      // Định dạng 2: { fields: [...] }
      tree = layout.fields.map((f) => normalizeTreeNode(f, allFieldCodes));
    } else if (Array.isArray(layout.blocks)) {
      // Định dạng 3: { blocks: [...] }
      tree = layout.blocks.map((group) => {
        const groupCode = group.fieldCode || group.id || "group";
        const normalizedChildren = Array.isArray(group.children)
          ? group.children.map((child) => normalizeTreeNode(child, allFieldCodes, groupCode))
          : [];
        return {
          id: group.id || groupCode,
          fieldCode: groupCode,
          fieldName: group.title || group.name || groupCode,
          dataType: "OBJECT",
          category: group.category || "CRITERIA_GROUP",
          isRequired: !!group.isRequired,
          isClass: true,
          classType: "OBJECT",
          effectiveFrom: group.effectiveFrom || "",
          effectiveTo: group.effectiveTo || "",
          isActive: group.isActive !== false,
          renderCondition: group.renderCondition || "",
          validationRules: group.validationRules || [],
          changeReason: group.changeReason || "",
          children: normalizedChildren,
        };
      });
    }
  }

  return {
    tree,
    signatureSlots,
    rawLayout: typeof rawJson === "string" ? rawJson : rawJson ? JSON.stringify(rawJson, null, 2) : "",
    scope,
  };
};

/**
 * Trích xuất phẳng danh sách trường dữ liệu và cấu hình chữ ký (backward compatible)
 */
export const extractFieldsAndSlotsFromTemplate = (template, allFieldCodes = []) => {
  const { tree, signatureSlots, rawLayout, scope } = extractTreeFromTemplate(template, allFieldCodes);
  const flattened = flattenTree(tree);

  // Khử trùng lặp fieldCode
  const seen = new Set();
  const uniqueFields = [];
  flattened.forEach((f) => {
    if (f.fieldCode && !seen.has(f.fieldCode)) {
      seen.add(f.fieldCode);
      uniqueFields.push(f);
    }
  });

  return {
    fields: uniqueFields,
    tree,
    signatureSlots,
    rawLayout,
    scope,
  };
};
