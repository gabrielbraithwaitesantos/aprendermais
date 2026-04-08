type ResourceClick = {
  tipoRecurso: 'PDF_OFICIAL' | 'YOUTUBE' | 'SITE';
  trilhaId: string;
  recursoId: string;
};

// Minimal telemetry: console log only (no personal data)
export function logResourceClick(event: ResourceClick) {
  try {
    // Swap for Firebase Analytics/event pipeline later
    console.log('[telemetry] recurso_click', event);
  } catch {}
}

