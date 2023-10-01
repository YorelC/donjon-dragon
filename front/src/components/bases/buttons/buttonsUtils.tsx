import clsx from "clsx";
import { ComponentPropsWithoutRef } from "react";

type color = "sky" | "orange" | "emerald";
type size = "small" | "medium" | "large";
type label = string;

export type labelAndStylesButtonBase = {
  label: label;
  color?: color;
  size?: size;
};

export type ButtonBaseProps = {
  labelAndStylesButtonBase: labelAndStylesButtonBase;
} & ComponentPropsWithoutRef<"button">;

export function applyStyles(color?: color, size?: size) {
  const colorClass = colorSelection(color ?? "sky");
  const sizeClass = sizeSelection(size ?? "medium");

  return clsx(colorClass, sizeClass, "font-bold text-white rounded-md");
}

function colorSelection(color: color) {
  switch (color) {
    case "sky":
      return "bg-blue-500 hover:bg-blue-800";
    case "orange":
      return "bg-orange-500 hover:bg-orange-800";
    case "emerald":
      return "bg-green-500 hover:bg-green-800";
    default:
      return "bg-blue-500 hover:bg-blue-800";
  }
}

function sizeSelection(size: size) {
  switch (size) {
    case "small":
      return "px-4 py-2 text-sm";
    case "medium":
      return "px-6 py-3 text-md";
    case "large":
      return "px-8 py-4 text-lg";
    default:
      return "px-6 py-3 text-md";
  }
}
