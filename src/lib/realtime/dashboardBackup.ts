function getRealtimeUrl() {
  return process.env.NEXT_PUBLIC_REALTIME_URL ?? "http://localhost:3001";
}

function getBackupFileName() {
  return `caudri-dashboard-${new Date()
    .toISOString()
    .replace(/[:.]/g, "-")}.zip`;
}

export async function exportDashboardBackup() {
  const response = await fetch(`${getRealtimeUrl()}/dashboard/export`);

  if (!response.ok) {
    throw new Error(`Export failed: ${response.status}`);
  }

  const backup = await response.blob();
  const objectUrl = URL.createObjectURL(backup);
  const link = document.createElement("a");

  link.href = objectUrl;
  link.download = getBackupFileName();
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
}

export async function importDashboardBackup(file: File) {
  const response = await fetch(`${getRealtimeUrl()}/dashboard/import`, {
    method: "POST",
    headers: {
      "Content-Type": "application/zip",
    },
    body: file,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Import failed: ${response.status} ${errorText}`);
  }
}

export async function resetDashboardState() {
  const response = await fetch(`${getRealtimeUrl()}/dashboard/reset`, {
    method: "POST",
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Reset failed: ${response.status} ${errorText}`);
  }
}
