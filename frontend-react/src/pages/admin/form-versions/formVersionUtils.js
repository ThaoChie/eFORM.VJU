/**
 * Trích xuất danh sách trường dữ liệu và cấu hình chữ ký từ templateLayoutJson
 * Hỗ trợ cả 3 định dạng:
 * 1. Mảng CRITERIA_GROUP kèm children (Chuẩn DRL VJU)
 * 2. Đối tượng { blocks: [...] }
 * 3. Đối tượng { fields: [...] }
 */
export const extractFieldsAndSlotsFromTemplate = (template, allFieldCodes = []) => {
  if (!template) return { fields: [], signatureSlots: null, rawLayout: "", scope: null };

  const rawJson = template.templateLayoutJson;
  let layout = null;
  try {
    layout = typeof rawJson === "string" ? JSON.parse(rawJson) : rawJson;
  } catch (e) {
    console.warn("Lỗi parse templateLayoutJson:", e);
  }

  let extractedItems = [];
  let signatureSlots = null;
  let scope = null;

  if (Array.isArray(layout)) {
    // Định dạng 1: Mảng khối tiêu chí (CRITERIA_GROUP)
    layout.forEach((group) => {
      if (group.fieldCode) {
        extractedItems.push({
          fieldCode: group.fieldCode,
          fieldName: group.title || group.name || group.fieldCode,
          dataType: "NUMBER",
          category: "CRITERIA_GROUP",
          isRequired: !!group.isRequired,
        });
      }
      if (Array.isArray(group.children)) {
        group.children.forEach((child) => {
          if (child.fieldCode) {
            extractedItems.push({
              fieldCode: child.fieldCode,
              fieldName: child.title || child.name || child.fieldCode,
              dataType: child.dataType || "NUMBER",
              category: child.category || "CRITERIA",
              isRequired: !!child.isRequired,
            });
          }
        });
      }
    });
  } else if (layout && typeof layout === "object") {
    scope = layout.scope;
    if (Array.isArray(layout.signatureSlots)) {
      signatureSlots = layout.signatureSlots;
    }

    if (Array.isArray(layout.fields)) {
      // Định dạng 2: { fields: [...] }
      extractedItems = layout.fields;
    } else if (Array.isArray(layout.blocks)) {
      // Định dạng 3: { blocks: [...] }
      layout.blocks.forEach((group) => {
        if (group.fieldCode) {
          extractedItems.push({
            fieldCode: group.fieldCode,
            fieldName: group.title || group.name || group.fieldCode,
            dataType: "NUMBER",
            category: "CRITERIA_GROUP",
            isRequired: !!group.isRequired,
          });
        }
        if (Array.isArray(group.children)) {
          group.children.forEach((child) => {
            if (child.fieldCode) {
              extractedItems.push({
                fieldCode: child.fieldCode,
                fieldName: child.title || child.name || child.fieldCode,
                dataType: child.dataType || "NUMBER",
                category: child.category || "CRITERIA",
                isRequired: !!child.isRequired,
              });
            }
          });
        }
      });
    }
  }

  // Khử trùng lặp mã trường (fieldCode)
  const seenCodes = new Set();
  const uniqueExtracted = [];
  for (const item of extractedItems) {
    if (item.fieldCode && !seenCodes.has(item.fieldCode)) {
      seenCodes.add(item.fieldCode);
      uniqueExtracted.push(item);
    }
  }

  // Khớp với allFieldCodes từ Danh bạ trường thông tin để lấy đủ metadata
  const matchedFields = uniqueExtracted.map((f) => {
    const found = allFieldCodes.find((af) => af.fieldCode === f.fieldCode);
    return found || {
      id: f.fieldCode,
      fieldCode: f.fieldCode,
      fieldName: f.fieldName || f.title || f.fieldCode,
      dataType: f.dataType || "NUMBER",
      category: f.category || "COMMON",
      isRequired: !!f.isRequired,
    };
  });

  return {
    fields: matchedFields,
    signatureSlots,
    rawLayout: typeof rawJson === "string" ? rawJson : rawJson ? JSON.stringify(rawJson, null, 2) : "",
    scope,
  };
};
