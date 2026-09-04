"use client";

type ShutterButtonProps = {
  onClick: () => void;
  disabled?: boolean;
};

export function ShutterButton({ onClick, disabled }: ShutterButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label="Capture worksheet photo"
      className="size-16 rounded-full bg-white shadow-lg transition active:scale-95 disabled:opacity-50"
    />
  );
}
