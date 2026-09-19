import { MD3LightTheme, configureFonts } from 'react-native-paper';

// Familias de la fuente Poppins (bundleada) para un look prolijo e igual en todo teléfono.
export const FONTS = {
  regular: 'Poppins_400Regular',
  medium: 'Poppins_500Medium',
  semibold: 'Poppins_600SemiBold',
  bold: 'Poppins_700Bold',
};

// Paleta tranquila inspirada en el amanecer/anochecer: lavanda, índigo suave y
// durazno del alba. Pastel y cohesiva, sin colores estridentes.
export const theme = {
  ...MD3LightTheme,
  fonts: configureFonts({ config: { fontFamily: FONTS.regular } }),
  colors: {
    ...MD3LightTheme.colors,
    primary: '#5A6BB0',
    onPrimary: '#FFFFFF',
    primaryContainer: '#E1E4F8',
    onPrimaryContainer: '#141A4A',
    secondary: '#6C6A8A',
    onSecondary: '#FFFFFF',
    secondaryContainer: '#E7E5F3',
    onSecondaryContainer: '#211F37',
    tertiary: '#8A6E58',
    tertiaryContainer: '#F7E3D4',
    onTertiaryContainer: '#301A0B',
    background: '#F3F2FB',
    onBackground: '#1B1B23',
    surface: '#FAF9FE',
    onSurface: '#1B1B23',
    surfaceVariant: '#E7E5F1',
    onSurfaceVariant: '#48475A',
    outline: '#7B7A90',
    outlineVariant: '#CBC9DA',
    error: '#B3261E',
    elevation: {
      ...MD3LightTheme.colors.elevation,
      level1: '#F4F2FC',
      level2: '#EEEBF8',
    },
  },
};

// Catálogo de retos: etiqueta, icono, meta por defecto y un color pastel propio
// (día = verde salvia, noche = índigo, amanecer = durazno).
export const RETOS = {
  pasos: {
    label: 'Pasos', icon: 'walk', metaDefault: 20, unidad: 'pasos',
    color: '#4E8975', container: '#D6EBE2', onContainer: '#0F2820',
  },
  saltos: {
    label: 'Saltos', icon: 'run-fast', metaDefault: 15, unidad: 'saltos',
    color: '#5566B8', container: '#E0E4F8', onContainer: '#131A4A',
  },
  lagartijas: {
    label: 'Lagartijas', icon: 'arm-flex', metaDefault: 5, unidad: 'lagartijas',
    color: '#B9714A', container: '#F7E1D2', onContainer: '#351A0B',
  },
};

// Sorteo del reto: devuelve una clave de RETOS al azar.
export function retoAleatorio() {
  const claves = Object.keys(RETOS);
  return claves[Math.floor(Math.random() * claves.length)];
}
