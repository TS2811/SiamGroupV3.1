# Frontend Theme Summary

This document outlines the visual theme, design tokens, and styling patterns used in the **Thailand Post Integration** web application.

## 1. Technology Stack & styling

The project typically uses a **Hybrid Styling Approach**:

- **Material UI (MUI) v7**: Primary UI component library for layout, inputs, and data display.
- **Tailwind CSS v4**: Utility-first CSS used for specific page layouts (e.g., Login), animations, and responsive adjustments.
- **Bootstrap 5**: Imported via `main.jsx`, likely for legacy grid support or specific utility classes.
- **SweetAlert2**: Standardized modal system for alerts and confirmations.

## 2. Color Palette

The color scheme is consistent with the **SXD Express / Thailand Post** branding.

### Primary Brand Colors

| Color Name         | Hex Code  | Usage                                                                      |
| :----------------- | :-------- | :------------------------------------------------------------------------- |
| **Deep Navy Blue** | `#162b61` | **Primary Color**. Used in Main Branding, Primary Buttons.                 |
| **Navy Text**      | `#0D1B3E` | **Header Text**, AppBar Background, Primary Button (Hover: `#08122E`).     |
| **SXD Red**        | `#ED1C24` | **Secondary Color**. Used for Brand Highlights ("SXD"), Secondary Buttons. |
| **Accent Yellow**  | `#FFC107` | **Warning Color**. Used for dividers, icons, and "Created/Pending" states. |

### Functional Colors

| Context        | MUI Color            | Hex/Ref           | Usage                                     |
| :------------- | :------------------- | :---------------- | :---------------------------------------- |
| **Background** | `background.default` | `#F5F5F5`         | Main application background (Light Gray). |
| **Surface**    | `background.paper`   | `#FFFFFF`         | Cards, Panels, Modals.                    |
| **text**       | `text.secondary`     | `#555555`         | Secondary text, labels.                   |
| **Success**    | `success`            | _(Default Green)_ | "Completed", "Delivered" statuses.        |
| **Error**      | `error`              | _(Default Red)_   | "Cancelled" status.                       |

### Gradients (Tailwind)

- **Login Background**: `bg-gradient-to-br from-red-600 to-red-900`

## 3. Typography

The application uses a specific Thai-compatible font stack.

- **Font Family**: `Kanit`, `Sarabun`, `Noto Sans Thai`, `sans-serif`.
- **Weights**:
  - **Bold**: Headers, Status Chips.
  - **Medium (500)**: Buttons.
  - **Regular**: Body text.

## 4. Component Styling (MUI Overrides)

Global overrides are defined in `src/main.jsx`.

### Buttons (`MuiButton`)

- **Border Radius**: `8px`
- **Text Transform**: `none` (prevents auto-uppercase)
- **Font**: `Kanit` (Weight 500)
- **Primary Style**: Navy Blue background (`#0D1B3E`) -> Darker Navy Hover (`#08122E`)
- **Secondary Style**: Red background (`#ED1C24`) -> Darker Red Hover (`#C4131A`)

### Cards / Paper (`MuiPaper`)

- **Border Radius**: `12px`
- **Shadow**: `0px 4px 20px rgba(13, 27, 62, 0.05)` (Subtle Navy shadow)

### App Bar (`MuiAppBar`)

- **Background**: `#0D1B3E` (Navy)
- **Border Radius**: `0`
- **Styling**: Includes a bottom border (`4px solid #FFC107`) to act as a gold accent line.

## 5. UI Patterns & Layout

### Main Layout

- **Header**: Fixed top App Bar with Logo ("SXD Express" - SXD in red, Express in white) and User Profile.
- **Content Area**: Centered `Container` with `maxWidth="xl"`.
- **Navigation**: Top-bar based navigation with icons (`Settings`, `Logout`).

### Login Page Pattern

- **Style**: Modern Glassmorphism.
- **Elements**:
  - Full-screen gradient background.
  - Floating orb decorations (`blur-3xl`).
  - **Card**: `bg-white/95`, `backdrop-blur-xl`, `rounded-2xl`, `shadow-2xl`.

### Status Badges

Used in shipment tables to indicate state.

- **Warning (Yellow)**: `Created`, `Pending`
- **Primary (Navy)**: `Shipped`, `Printed`
- **Success (Green)**: `Completed`, `Delivered`
- **Error (Red)**: `Cancelled`

## 6. Iconography

- **Library**: Material Icons (`@mui/icons-material`).
- **Common Icons**: `Logout`, `Settings`, `Print` (likely), `Search`.
