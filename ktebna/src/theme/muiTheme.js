import { createTheme } from "@mui/material/styles";

// MUI can't consume the OKLCH custom properties from index.css directly — it
// runs alpha()/darken() over these values — so the palette is mirrored here as
// hex. Keep in sync with the tokens in src/index.css.
const light = {
  background: "#fbf7f2",
  surface: "#fefdfa",
  foreground: "#241e1a",
  muted: "#f0ece5",
  mutedForeground: "#706760",
  primary: "#a14900",
  primaryForeground: "#fdfaf4",
  border: "#e0dcd5",
  destructive: "#e7000b",
  trust: "#27673d",
};

const dark = {
  background: "#0d0b09",
  surface: "#171411",
  foreground: "#e7e4df",
  muted: "#27231f",
  mutedForeground: "#a49d95",
  primary: "#e08533",
  primaryForeground: "#1d140d",
  border: "#312d28",
  destructive: "#ff6467",
  trust: "#57bc80",
};

const schemeFor = (c) => ({
  palette: {
    primary: { main: c.primary, contrastText: c.primaryForeground },
    success: { main: c.trust },
    error: { main: c.destructive },
    background: { default: c.background, paper: c.surface },
    text: { primary: c.foreground, secondary: c.mutedForeground },
    divider: c.border,
    action: { hover: c.muted },
  },
});

const theme = createTheme({
  cssVariables: { colorSchemeSelector: "media" },
  colorSchemes: { light: schemeFor(light), dark: schemeFor(dark) },
  shape: { borderRadius: 8 }, // matches --radius: 0.5rem
  typography: {
    fontFamily: '"Plus Jakarta Sans", ui-sans-serif, system-ui, sans-serif',
    h1: { fontFamily: '"Merriweather", ui-serif, Georgia, serif', fontWeight: 700 },
    h2: { fontFamily: '"Merriweather", ui-serif, Georgia, serif', fontWeight: 700 },
    h3: { fontFamily: '"Merriweather", ui-serif, Georgia, serif', fontWeight: 700 },
    h6: { fontFamily: '"Merriweather", ui-serif, Georgia, serif', fontWeight: 700 },
    button: { textTransform: "none", fontWeight: 500 },
  },
  components: {
    MuiPaper: { styleOverrides: { root: { backgroundImage: "none" } } },
    MuiDialog: {
      styleOverrides: { paper: { borderRadius: 12, border: "1px solid var(--mui-palette-divider)" } },
    },
    MuiButton: { defaultProps: { disableElevation: true }, styleOverrides: { root: { borderRadius: 8 } } },
    MuiOutlinedInput: { styleOverrides: { root: { borderRadius: 8 } } },
  },
});

export default theme;
