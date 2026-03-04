export const LAYER_TYPES = [
  {
    id: 'main',
    label: 'Main',
    sublabel: 'Best for main meals',
    heightLabel: 'Standard · Single',
    color: 0x0d2a42,
    emissive: 0x1a5080,
    emissiveIntensity: 0.20,
    accentCss: '#4a9eff',
    height: 0.95,
    compartments: 1,
    compartmentSvg: `<circle cx="20" cy="20" r="16" stroke="currentColor" stroke-width="1.5"/>`,
  },
  {
    id: 'duo',
    label: 'Duo',
    sublabel: 'Best for breakfast',
    heightLabel: 'Standard · 2 compartments',
    color: 0x2a1040,
    emissive: 0x5020a0,
    emissiveIntensity: 0.20,
    accentCss: '#c084fc',
    height: 0.95,
    compartments: 2,
    compartmentSvg: `
      <circle cx="20" cy="20" r="16" stroke="currentColor" stroke-width="1.5"/>
      <line x1="20" y1="4" x2="20" y2="36" stroke="currentColor" stroke-width="1.5"/>`,
  },
  {
    id: 'quad',
    label: 'Quad',
    sublabel: 'Best for snacks',
    heightLabel: 'Standard · 4 compartments',
    color: 0x0e2e14,
    emissive: 0x1e6030,
    emissiveIntensity: 0.20,
    accentCss: '#86efac',
    height: 0.95,
    compartments: 4,
    compartmentSvg: `
      <circle cx="20" cy="20" r="16" stroke="currentColor" stroke-width="1.5"/>
      <line x1="20" y1="4" x2="20" y2="36" stroke="currentColor" stroke-width="1.5"/>
      <line x1="4" y1="20" x2="36" y2="20" stroke="currentColor" stroke-width="1.5"/>`,
  },
  {
    id: 'tall',
    label: 'Tall',
    sublabel: 'Best for salads & greens',
    heightLabel: 'Tall · Single',
    color: 0x2a1808,
    emissive: 0x703010,
    emissiveIntensity: 0.20,
    accentCss: '#fb923c',
    height: 1.55,
    compartments: 1,
    compartmentSvg: `<ellipse cx="20" cy="20" rx="13" ry="17" stroke="currentColor" stroke-width="1.5"/>`,
  },
  {
    id: 'liquid',
    label: 'Liquid',
    sublabel: 'Best for soups & drinks',
    heightLabel: 'Short · Sealed',
    color: 0x081c2a,
    emissive: 0x1060a0,
    emissiveIntensity: 0.25,
    accentCss: '#7edcdc',
    height: 0.70,
    compartments: 1,
    compartmentSvg: `
      <circle cx="20" cy="20" r="16" stroke="currentColor" stroke-width="1.5"/>
      <path d="M6 22 Q13 14 20 22 Q27 30 34 22" stroke="currentColor" stroke-width="1.5" fill="none"/>`,
  },
]
