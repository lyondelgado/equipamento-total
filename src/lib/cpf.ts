// CPF mask helpers — store digits only in DB, display formatted.
// Standard CPF has 11 digits: xxx.xxx.xxx-xx
// If only 10 digits are stored (leading zero stripped), format as xx.xxx.xxx-xx.

export function onlyDigits(value: string): string {
  return (value || "").replace(/\D/g, "");
}

export function formatCpf(value: string | null | undefined): string {
  const digits = onlyDigits(value || "");
  if (!digits) return "";
  if (digits.length === 11) {
    return digits.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4");
  }
  if (digits.length === 10) {
    return digits.replace(/^(\d{2})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4");
  }
  // Progressive mask while typing
  const d = digits.slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}
