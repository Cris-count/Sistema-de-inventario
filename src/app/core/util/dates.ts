export function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function defaultDesdeHasta(days = 30): { desde: string; hasta: string } {
  const hasta = new Date();
  const desde = new Date();
  desde.setDate(desde.getDate() - days);
  return { desde: isoDate(desde), hasta: isoDate(hasta) };
}
