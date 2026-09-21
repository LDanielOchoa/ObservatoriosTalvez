/**
 * Clases compartidas para todos los controles de formulario.
 * Garantiza que inputs, selects y cualquier otro campo se vean idénticos.
 */

export const fieldControl = [
  // Forma y superficie
  "w-full rounded-2xl border border-black/10 bg-white",
  // Transición base
  "transition-colors duration-200 ease-out",
  // Hover
  "hover:border-black/20",
].join(" ");

export const fieldControlFocusWithin = [
  "focus-within:border-[#259ce6]",
  "focus-within:ring-4 focus-within:ring-[#259ce6]/10",
].join(" ");

export const fieldControlFocusButton = [
  "focus-visible:border-[#259ce6]",
  "focus-visible:ring-4 focus-visible:ring-[#259ce6]/10",
  "data-[open]:border-[#259ce6]",
  "data-[open]:ring-4 data-[open]:ring-[#259ce6]/10",
].join(" ");

export const fieldLabel =
  "flex items-center gap-2 text-[#0a0a0a] text-sm font-medium tracking-[-0.01em]";

export const fieldLabelIcon = "text-[#787774]";
