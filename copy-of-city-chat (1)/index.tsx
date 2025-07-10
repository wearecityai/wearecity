import React from 'react';
import ReactDOM from 'react-dom/client';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import App from './App.tsx'; // Changed from './App'

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);

// A simple component to manage and provide the theme mode
const ThemedApp = () => {
  const [mode, setMode] = React.useState<'light' | 'dark'>(() => {
    const storedTheme = localStorage.getItem('theme');
    if (storedTheme === 'dark' || storedTheme === 'light') {
      return storedTheme;
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  React.useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      const newMode = mediaQuery.matches ? 'dark' : 'light';
      setMode(newMode);
      localStorage.setItem('theme', newMode);
      document.documentElement.classList.toggle('dark', newMode === 'dark');
    };

    document.documentElement.classList.toggle('dark', mode === 'dark');
    localStorage.setItem('theme', mode);

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [mode]);

  const theme = React.useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          ...(mode === 'dark'
            ? {
                primary: {
                  main: '#89b4fc', // Gemini blue for text, icons
                  dark: '#3c75dc', // A darker, more saturated blue for selected backgrounds
                  contrastText: '#e3e3e3',
                },
                secondary: {
                  main: '#f389ab', // Gemini pink accent
                  contrastText: '#131314',
                },
                background: {
                  default: '#131314', // Main background
                  paper: '#1e1f20',   // Sidebar, chat input, cards
                },
                text: {
                  primary: '#e3e3e3', // Main text
                  secondary: '#9aa0a6', // Secondary text (placeholders, captions)
                },
                action: {
                  active: '#89b4fc', // For icons, selected states
                  hover: 'rgba(137, 180, 252, 0.08)', // Hover for primary elements
                  selected: 'rgba(60, 117, 220, 0.25)', // Adjusted selected for drawer: primary.dark with opacity
                  disabledBackground: 'rgba(227, 227, 227, 0.12)',
                  disabled: 'rgba(227, 227, 227, 0.38)',
                },
                divider: 'rgba(227, 227, 227, 0.12)', // Borders
              }
            : { // Light mode (basic, can be expanded)
                primary: {
                  main: '#1a73e8',
                  dark: '#0b57d0',
                },
                secondary: {
                  main: '#d32f2f',
                },
                background: {
                  default: '#f8f9fa',
                  paper: '#ffffff',
                },
                text: {
                  primary: '#202124',
                  secondary: '#5f6368',
                },
                 action: {
                  active: '#1a73e8',
                  hover: 'rgba(26, 115, 232, 0.08)',
                  selected: 'rgba(26, 115, 232, 0.16)', // Default light mode selected
                },
                divider: 'rgba(0, 0, 0, 0.12)',
              }),
        },
        typography: {
          fontFamily: '"Google Sans", Roboto, Helvetica, Arial, sans-serif',
          h6: {
            fontWeight: 500,
            fontSize: '1.1rem', // Slightly smaller h6 for Gemini look
          },
          button: {
            textTransform: 'none',
            fontWeight: 500,
          },
          body1: {
            fontSize: '0.95rem',
          },
          body2: {
            fontSize: '0.875rem',
          },
          caption: {
            fontSize: '0.75rem',
          }
        },
        shape: {
          borderRadius: 8, // Default border radius
        },
        components: {
          MuiButton: {
            styleOverrides: {
              root: ({ ownerState, theme: currentButtonTheme }) => ({ // theme parameter renamed to currentButtonTheme
                borderRadius: ownerState.variant === 'contained' && (ownerState.color === 'primary' || ownerState.color === 'secondary') ? '20px' : '4px', // Pill-shape for main CTA
                 padding: ownerState.size === 'small' ? '3px 10px' : '6px 16px',
              }), 
              contained: {
                 boxShadow: 'none',
                 '&:hover': {
                    boxShadow: 'none',
                 }
              },
            },
          },
          MuiPaper: {
            defaultProps: {
              elevation: 0,
            },
            styleOverrides: {
              root: {
                 backgroundImage: 'none',
              },
              outlined: {
                 borderColor: mode === 'dark' ? 'rgba(227, 227, 227, 0.2)' : 'rgba(0, 0, 0, 0.15)',
              }
            }
          },
          MuiOutlinedInput: {
             styleOverrides: {
                root: ({ theme: currentInputTheme }) => ({ // Changed to a function, theme parameter renamed
                    borderRadius: '28px',
                    backgroundColor: mode === 'dark' ? '#1e1f20' : '#fff', // Match paper for input bg
                    '& fieldset': {
                         borderColor: mode === 'dark' ? 'rgba(227, 227, 227, 0.3)' : 'rgba(0, 0, 0, 0.23)',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: mode === 'dark' ? 'rgba(137, 180, 252, 0.7)' : 'rgba(26, 115, 232, 0.7)',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: mode === 'dark' ? currentInputTheme.palette.primary.main : currentInputTheme.palette.primary.main,
                        borderWidth: '1px',
                    },
                }),
                input: {
                    padding: '14px 18px', // Slightly more padding
                    fontSize: '0.95rem',
                }
             }
          },
          MuiChip: {
            styleOverrides: {
              root: {
                borderRadius: '8px', // Gemini chips are less rounded
                fontSize: '0.8rem',
                height: '28px',
                backgroundColor: mode === 'dark' ? 'rgba(227, 227, 227, 0.1)' : 'rgba(0, 0, 0, 0.08)',
                color: mode === 'dark' ? '#e3e3e3' : '#3c4043',
                '&:hover': {
                  backgroundColor: mode === 'dark' ? 'rgba(227, 227, 227, 0.15)' : 'rgba(0, 0, 0, 0.12)',
                },
                '& .MuiChip-icon': {
                  color: mode === 'dark' ? '#9aa0a6' : '#5f6368',
                  marginLeft: '8px',
                  marginRight: '-4px',
                },
              },
              filled: { // Ensure filled chips also follow this styling if used explicitly
                  backgroundColor: mode === 'dark' ? 'rgba(227, 227, 227, 0.1)' : 'rgba(0, 0, 0, 0.08)',
                  color: mode === 'dark' ? '#e3e3e3' : '#3c4043',
                  '&:hover': {
                    backgroundColor: mode === 'dark' ? 'rgba(227, 227, 227, 0.15)' : 'rgba(0, 0, 0, 0.12)',
                  }
              },
            }
          },
          MuiCard: {
            styleOverrides: {
              root: {
                 borderRadius: '12px',
                 border: `1px solid ${mode === 'dark' ? 'rgba(227, 227, 227, 0.1)' : 'rgba(0, 0, 0, 0.08)'}`,
              }
            }
          },
          MuiListItemButton: {
            styleOverrides: {
              root: ({ theme: currentItemTheme }) => ({ // Changed to a function, theme parameter renamed
                borderRadius: '20px', // Pill shaped recent items
                margin: '4px 8px', // Add margin to match Gemini
                padding: '8px 16px',
                '&.Mui-selected': {
                  backgroundColor: mode === 'dark' ? currentItemTheme.palette.primary.dark : currentItemTheme.palette.action.selected,
                  '&:hover': {
                    backgroundColor: mode === 'dark' ? currentItemTheme.palette.primary.dark : currentItemTheme.palette.action.selected, // Maintain color on hover
                  },
                  '& .MuiListItemIcon-root, & .MuiListItemText-primary': {
                     color: mode === 'dark' ? currentItemTheme.palette.primary.contrastText : currentItemTheme.palette.primary.main,
                  },
                },
                 '&:hover': {
                    backgroundColor: mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
                 }
              }),
            },
          },
          MuiDrawer: {
            styleOverrides: {
              paper: {
                borderRight: 'none',
                backgroundColor: mode === 'dark' ? '#1e1f20' : '#f1f3f4',
              }
            }
          },
          MuiAppBar: {
            defaultProps: {
                elevation: 0,
            },
            styleOverrides: {
                root: {
                    backgroundColor: mode === 'dark' ? '#131314' : '#ffffff', // Gemini appbar matches main bg
                    borderBottom: `1px solid ${mode === 'dark' ? 'rgba(227, 227, 227, 0.12)' : 'rgba(0,0,0,0.12)'}`,
                }
            }
          },
          MuiAvatar: {
            styleOverrides: {
              root: {
                width: 32,
                height: 32,
                fontSize: '0.875rem',
              }
            }
          }
        }
      }),
    [mode]
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App toggleTheme={() => setMode(prev => (prev === 'light' ? 'dark' : 'light'))} currentThemeMode={mode}/>
    </ThemeProvider>
  );
};

root.render(
  <React.StrictMode>
    <ThemedApp />
  </React.StrictMode>
);