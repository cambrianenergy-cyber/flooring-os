/**
 * Combine classnames together, filtering out falsy values
 * Useful for conditional CSS classes in React components
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}
