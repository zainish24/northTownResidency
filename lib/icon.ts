import * as LucideIcons from 'lucide-react'

/**
 * Take a lucide icon name (kebab-case or camel-case) and return the corresponding
 * React component. Falls back to `Home` if not found.
 */
export function getIconComponent(name: string | null | undefined) {
  if (!name) return (LucideIcons as any).Home

  // convert flexible kebab/underscore case to PascalCase
  const pascal = name
    .replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ''))
    .replace(/^(.)/, (c) => c.toUpperCase())

  // try direct match
  if ((LucideIcons as any)[pascal]) {
    return (LucideIcons as any)[pascal]
  }

  // some common aliases
  const aliasMap: Record<string, string> = {
    'treepine': 'TreePine',
    'trees': 'Trees',
    'building': 'Building2',
    'home': 'Home',
    'store': 'Store',
  }

  const alias = aliasMap[pascal.toLowerCase()]
  if (alias && (LucideIcons as any)[alias]) {
    return (LucideIcons as any)[alias]
  }

  return (LucideIcons as any).Home
}
