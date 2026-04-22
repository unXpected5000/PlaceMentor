function fillForm(form, data = {}) {
  Array.from(form.elements).forEach((element) => {
    if (!element.name) {
      return;
    }

    const value = data[element.name];
    if (Array.isArray(value)) {
      element.value = value.join(", ");
    } else if (value != null) {
      element.value = value;
    }
  });
}

function formatPercentage(value) {
  if (value == null || Number.isNaN(Number(value))) {
    return "--";
  }

  return `${Math.round(Number(value))}%`;
}

function downloadCsv(filename, rows) {
  const csv = rows
    .map((row) =>
      row
        .map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`)
        .join(",")
    )
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export { fillForm, formatPercentage, downloadCsv };
