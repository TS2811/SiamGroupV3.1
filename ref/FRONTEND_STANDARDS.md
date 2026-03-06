# 📘 Frontend Development Standards

### The Siamgroup X Thailand Post (SXD Express)

> **เอกสารมาตรฐานการพัฒนา Frontend** — เพื่อให้ทีมทุกคนเขียนโค้ดในแนวทางเดียวกัน

---

## 📋 สารบัญ

1. [Tech Stack & Versions](#1-tech-stack--versions)
2. [โครงสร้างโปรเจกต์ (Project Structure)](#2-โครงสร้างโปรเจกต์-project-structure)
3. [การตั้งค่าเริ่มต้น (Configuration)](#3-การตั้งค่าเริ่มต้น-configuration)
4. [MUI Theme System](#4-mui-theme-system)
5. [Styling Strategy](#5-styling-strategy)
6. [Component Architecture](#6-component-architecture)
7. [Routing & Navigation](#7-routing--navigation)
8. [State Management](#8-state-management)
9. [API Service Layer](#9-api-service-layer)
10. [Authentication](#10-authentication)
11. [Naming Conventions](#11-naming-conventions)
12. [Icon Usage](#12-icon-usage)
13. [Notification & Dialog](#13-notification--dialog)
14. [Coding Rules & Best Practices](#14-coding-rules--best-practices)
15. [Performance Tips](#15-performance-tips)

---

## 1. Tech Stack & Versions

| Library                 | Version       | Purpose                                 |
| ----------------------- | ------------- | --------------------------------------- |
| **React**               | 19.x          | UI Framework                            |
| **Vite**                | 7.x           | Build Tool & Dev Server                 |
| **MUI (Material UI)**   | **7.x** (v6+) | Component Library & Theming             |
| **@mui/icons-material** | 7.x           | Icon Library                            |
| **Emotion**             | 11.x          | CSS-in-JS (MUI Styling Engine)          |
| **TailwindCSS**         | 4.x           | Utility CSS (เสริม)                     |
| **react-router-dom**    | 7.x           | Client-Side Routing (SPA)               |
| **Axios**               | 1.x           | HTTP Client                             |
| **SweetAlert2**         | 11.x          | Notification / Alert Popups             |
| **Bootstrap**           | 5.x           | Utility Layouts (Modal ในบาง component) |
| **react-easy-crop**     | 5.x           | Image Cropping                          |

> ⚠️ **MUI v6+ (ปัจจุบัน v7)**: ใช้ `@mui/material` เป็นหลักในการสร้าง UI components ทุกตัว

### การติดตั้ง

```bash
# Clone แล้วเข้าไปที่ frontend/
cd frontend
npm install
npm run dev    # Dev server ที่ port 5100
npm run build  # Build สำหรับ production → dist/
```

---

## 2. โครงสร้างโปรเจกต์ (Project Structure)

```text
frontend/
├── index.html              # Entry HTML (โหลด Google Fonts ที่นี่)
├── vite.config.js          # Vite config (base path, plugins)
├── package.json
├── public/                 # Static assets (favicon, images)
│
└── src/
    ├── main.jsx            # ★ Entry Point — MUI Theme + App render
    ├── App.jsx             # ★ Router Setup + ProtectedRoute
    ├── index.css            # Tailwind import
    │
    ├── views/              # 📄 Page-level components (หนึ่งหน้าจอ)
    │   ├── MainLayout.jsx       # Layout หลัก (AppBar + Outlet)
    │   ├── Login.jsx            # หน้า Login
    │   ├── ShipmentManagement.jsx # หน้าจัดการ Shipment (Tabs)
    │   ├── SystemSettings.jsx   # หน้า Settings
    │   └── NotFound.jsx         # 404 Page
    │
    ├── subviews/           # 📑 Tab/Section ย่อยภายใน View
    │   ├── CreateShipmentTab.jsx
    │   ├── CustomerManagementTab.jsx
    │   └── ShipmentHistoryTab.jsx
    │
    ├── component/          # 🧩 Reusable Components
    │   ├── AddressForm.jsx      # ฟอร์มที่อยู่ (Thai Address Auto-complete)
    │   ├── CustomerSearch.jsx   # Dialog ค้นหาลูกค้า
    │   ├── DateRangePicker.jsx  # ตัวเลือกช่วงวันที่
    │   ├── LogoUploader.jsx     # อัปโหลด/ครอป Logo
    │   ├── PrintButton.jsx      # ปุ่มพิมพ์ Label
    │   ├── StatusBadge.jsx      # Chip แสดงสถานะ
    │   └── EasyUploadJSON.jsx   # อัปโหลด JSON
    │
    ├── context/            # 🔗 React Context (Global State)
    │   └── AuthContext.jsx      # Authentication State
    │
    ├── services/           # 🌐 API Layer
    │   └── api.js               # Axios instance + endpoints
    │
    ├── utils/              # 🔧 Utility Functions
    │   └── cropImage.js         # Canvas-based image cropping
    │
    └── assets/             # 🎨 Static assets (images, SVG)
```

### หลักการจัดไฟล์

| Folder       | ใช้เมื่อไหร่                      | ตัวอย่าง                             |
| ------------ | --------------------------------- | ------------------------------------ |
| `views/`     | หน้าจอหลัก (1 route = 1 file)     | `Login.jsx`, `SystemSettings.jsx`    |
| `subviews/`  | ส่วนย่อยของหน้าจอ (Tab content)   | `CreateShipmentTab.jsx`              |
| `component/` | Component ที่ใช้ซ้ำได้หลายที่     | `StatusBadge.jsx`, `AddressForm.jsx` |
| `context/`   | React Context สำหรับ Global State | `AuthContext.jsx`                    |
| `services/`  | API calls / Backend communication | `api.js`                             |
| `utils/`     | Pure functions ที่ไม่มี UI        | `cropImage.js`                       |

---

## 3. การตั้งค่าเริ่มต้น (Configuration)

### `vite.config.js`

```javascript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [tailwindcss(), react()],
  base: "/thailandpost/", // ★ ต้องตรงกับ path บน server
});
```

> **สำคัญ**: `base` ใน `vite.config.js` ต้องตรงกับ `basename` ใน `BrowserRouter`

### `index.html`

```html
<!-- โหลด Google Fonts สำหรับรองรับภาษาไทย -->
<link
  href="https://fonts.googleapis.com/css2?family=Kanit:wght@300;400;500;600&family=Noto+Sans+Thai:wght@300;400;500;600&family=Sarabun:wght@300;400;500;600&display=swap"
  rel="stylesheet"
/>
```

---

## 4. MUI Theme System

> ★ **ทุก Component ต้องใช้ Theme เป็นหลัก** — ห้าม hardcode สีหรือ font โดยตรง

### การตั้งค่า Theme — `main.jsx`

```jsx
import { createTheme, ThemeProvider } from "@mui/material/styles";

const theme = createTheme({
  typography: {
    fontFamily: ["Kanit", "Sarabun", "Noto Sans Thai", "sans-serif"].join(","),
  },
  palette: {
    primary: { main: "#162b61ff" }, // Deep Navy Blue
    secondary: { main: "#ED1C24" }, // Thailand Post Red
    warning: { main: "#FFC107" }, // Yellow Accent
    background: {
      default: "#F5F5F5", // Light Gray
      paper: "#FFFFFF",
    },
    text: {
      primary: "#0D1B3E", // Navy text
      secondary: "#555555",
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: "none", // ★ ไม่แปลงเป็น UPPERCASE
          fontFamily: "Kanit",
          fontWeight: 500,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: "0px 4px 20px rgba(13, 27, 62, 0.05)",
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: "#0D1B3E",
          borderRadius: 0,
        },
      },
    },
  },
});

// ★ Wrap App ด้วย ThemeProvider เสมอ
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <App />
    </ThemeProvider>
  </StrictMode>,
);
```

### 🎨 Color Palette Reference

| Token                | Hex       | ใช้เมื่อ                    |
| -------------------- | --------- | --------------------------- |
| `primary.main`       | `#162B61` | AppBar, ปุ่มหลัก, หัวข้อ    |
| `secondary.main`     | `#ED1C24` | ปุ่ม Danger, Logo accent    |
| `warning.main`       | `#FFC107` | Accent line, Warning badges |
| `background.default` | `#F5F5F5` | พื้นหลังหน้าจอ              |
| `background.paper`   | `#FFFFFF` | Card, Paper, Dialog         |
| `text.primary`       | `#0D1B3E` | ข้อความหลัก                 |
| `text.secondary`     | `#555555` | ข้อความรอง                  |

### วิธีใช้สีจาก Theme (ถูกต้อง vs ผิด)

```jsx
// ✅ ถูก — ใช้ theme token
<Button color="primary">Save</Button>
<Typography color="text.secondary">Note</Typography>
<Box sx={{ bgcolor: 'background.paper' }}>...</Box>

// ❌ ผิด — hardcode สี
<Button sx={{ backgroundColor: '#162b61' }}>Save</Button>
<Typography sx={{ color: '#555' }}>Note</Typography>
```

---

## 5. Styling Strategy

> **ลำดับความสำคัญ**: MUI `sx` prop → MUI Theme Override → TailwindCSS (เสริม)

### 5.1 MUI `sx` Prop (แนะนำ)

ใช้เป็นหลักสำหรับ inline styling ของ MUI components:

```jsx
<Box sx={{ display: "flex", alignItems: "center", gap: 2, mt: 4, mb: 4 }}>
  <Typography variant="h5" sx={{ fontWeight: "bold", color: "#fff" }}>
    Title
  </Typography>
</Box>
```

### 5.2 MUI Theme Overrides (Global)

ตั้งค่า default style ของ components ทั้งระบบใน `createTheme()`:

```javascript
components: {
  MuiButton: {
    styleOverrides: {
      root: { borderRadius: 8, textTransform: 'none' },
    },
  },
}
```

### 5.3 TailwindCSS (เสริม)

ใช้ได้สำหรับ layout utilities ที่ไม่ใช่ MUI components:

```jsx
// ✅ ใช้ Tailwind สำหรับ layout wrapper ทั่วไป
<div className="min-h-screen flex items-center justify-center bg-gray-50">

// ❌ ห้ามใช้ Tailwind ซ้อนกับ MUI — จะเกิด conflict
<Button className="bg-blue-500 text-white">  // ผิด!
```

### 5.4 Typography Standards

| ใช้เมื่อ              | Font           | Weight  |
| --------------------- | -------------- | ------- |
| หัวข้อหลัก / ชื่อเมนู | Kanit          | 500-600 |
| ข้อความทั่วไป / Body  | Sarabun        | 300-400 |
| Fallback              | Noto Sans Thai | -       |

---

## 6. Component Architecture

### 6.1 รูปแบบการเขียน Component

> ★ ใช้ **Arrow Function** + `export default` เสมอ

```jsx
import React from "react";
import { Box, Typography, Button } from "@mui/material";

const MyComponent = ({ title, onAction }) => {
  // ★ State declarations
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  // ★ Effects
  useEffect(() => {
    // fetch data...
  }, []);

  // ★ Event handlers
  const handleClick = () => {
    onAction?.();
  };

  // ★ Render
  return (
    <Box>
      <Typography variant="h6">{title}</Typography>
      <Button onClick={handleClick}>Action</Button>
    </Box>
  );
};

export default MyComponent;
```

### 6.2 ลำดับภายใน Component

```
1. imports
2. const Component = ({ props }) => {
3.    hooks (useState, useEffect, useNavigate, useAuth)
4.    computed values / derived state
5.    event handlers
6.    return JSX
7. };
8. export default Component;
```

### 6.3 ตัวอย่าง Reusable Component — `StatusBadge`

```jsx
import React from "react";
import { Chip } from "@mui/material";

const StatusBadge = ({ status }) => {
  let color = "default";
  let label = status || "Unknown";

  switch (status?.toLowerCase()) {
    case "created":
    case "pending":
      color = "warning";
      break;
    case "shipped":
    case "printed":
      color = "primary";
      break;
    case "completed":
    case "delivered":
      color = "success";
      break;
    case "cancelled":
      color = "error";
      break;
    default:
      color = "default";
  }

  return (
    <Chip
      label={label}
      color={color}
      size="small"
      sx={{ fontWeight: "bold" }}
    />
  );
};

export default StatusBadge;
```

### 6.4 การแบ่ง Component

```
views/ShipmentManagement.jsx        ← หน้าจอหลัก (มี Tabs)
    ├── subviews/CreateShipmentTab.jsx   ← Tab content
    │       └── component/AddressForm.jsx    ← Reusable form
    ├── subviews/CustomerManagementTab.jsx
    └── subviews/ShipmentHistoryTab.jsx
            └── component/StatusBadge.jsx
```

**กฎ:**

- **views/** = 1 หน้าจอ = 1 route = 1 file
- **subviews/** = ส่วนย่อยที่ binding กับ view หนึ่ง (เช่น tab panels)
- **component/** = ใช้ซ้ำได้ตั้งแต่ 2 ที่ขึ้นไป ถึงย้ายไปอยู่ component/

---

## 7. Routing & Navigation

### 7.1 Setup — `App.jsx`

```jsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter basename="/thailandpost">
        {" "}
        {/* ★ ต้องตรงกับ vite.config.js base */}
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <MainLayout /> {/* ★ Layout ครอบทุกหน้า */}
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/shipment" replace />} />
            <Route path="shipment" element={<ShipmentManagement />} />
            <Route path="settings" element={<SystemSettings />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};
```

### 7.2 Layout Pattern

```
MainLayout.jsx
├── AppBar (Header)
└── <Container>
    └── <Outlet />    ← React Router จะ render หน้าย่อยที่ตรง route ตรงนี้
```

### 7.3 Navigation

```jsx
import { useNavigate } from "react-router-dom";

const navigate = useNavigate();

// ★ ใช้ relative path (ไม่ต้องใส่ basename)
navigate("/settings");
navigate("/shipment");
```

### 7.4 ProtectedRoute Pattern

```jsx
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  return children;
};
```

---

## 8. State Management

### 8.1 Local State — `useState`

ใช้สำหรับ state ที่อยู่ภายใน component เดียว:

```jsx
const [formData, setFormData] = useState({ name: "", phone: "" });
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);
```

### 8.2 Global State — React Context

ใช้สำหรับ state ที่ต้องแชร์ข้าม component (เช่น Auth):

```jsx
// context/AuthContext.jsx
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ... login, logout logic

  return (
    <AuthContext.Provider
      value={{ user, login, logout, loading, isAuthenticated: !!user }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
```

**การใช้งาน:**

```jsx
import { useAuth } from "../context/AuthContext";

const MyComponent = () => {
  const { user, logout, isAuthenticated } = useAuth();
  // ...
};
```

### 8.3 Persistence — `localStorage`

```jsx
// ★ Pattern: เก็บข้อมูลฟอร์มลง localStorage เพื่อกันหน้าหาย
useEffect(() => {
  localStorage.setItem("form_draft", JSON.stringify(formData));
}, [formData]);

// ★ โหลดคืนตอนเปิดหน้า
useEffect(() => {
  const saved = localStorage.getItem("form_draft");
  if (saved) setFormData(JSON.parse(saved));
}, []);

// ★ ลบหลัง submit สำเร็จ
localStorage.removeItem("form_draft");
```

---

## 9. API Service Layer

### 9.1 โครงสร้าง — `services/api.js`

```javascript
import axios from "axios";
import Swal from "sweetalert2";

// ★ Auto-detect environment
export let API_BASE_URL;
const hostname = window.location.hostname;
if (hostname === "localhost" || hostname === "127.0.0.1") {
  API_BASE_URL = "http://localhost/thailandpost/backend/index.php";
} else {
  API_BASE_URL = `${window.location.origin}/thailandpost/backend/index.php`;
}

// ★ Shared Axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    "API-Key": "YOUR_API_KEY",
  },
});

// ★ Global error interceptor — แสดง SweetAlert2 อัตโนมัติ
api.interceptors.response.use(
  (response) => response.data, // ★ unwrap .data อัตโนมัติ
  (error) => {
    const message = error.response?.data?.message || "Something went wrong";
    Swal.fire({ icon: "error", title: "Error", text: message });
    return Promise.reject(error);
  },
);

// ★ Named exports สำหรับแต่ละ endpoint
export const endpoints = {
  createShipment: (data) => api.post("?endpoint=shipment_create", data),
  getHistory: (params) => api.get("?endpoint=history", { params }),
  searchCustomer: (query) =>
    api.get(`?endpoint=customer_search&q=${encodeURIComponent(query)}`),
  // ... เพิ่ม endpoint ใหม่ที่นี่
};

export default api;
```

### 9.2 วิธีเรียกใช้ใน Component

```jsx
import { endpoints } from "../services/api";

const handleSave = async () => {
  setLoading(true);
  try {
    const result = await endpoints.createShipment(formData);
    // result ได้ data ตรงๆ (ไม่ต้อง .data อีก)
    Swal.fire("สำเร็จ!", "บันทึกเรียบร้อย", "success");
  } catch (err) {
    // error ถูก handle โดย interceptor แล้ว
    console.error(err);
  } finally {
    setLoading(false);
  }
};
```

### 9.3 กฎการเพิ่ม API ใหม่

1. **เพิ่มใน `endpoints` object** ใน `api.js` เท่านั้น
2. **ห้าม** เรียก `axios` หรือ `fetch` ตรงๆ ใน component
3. ใช้ `try/catch/finally` pattern เสมอ
4. **Loading state** ต้องมีทุกครั้งที่เรียก API

---

## 10. Authentication

### Flow

```
┌──────────────────┐     POST /login      ┌──────────────┐
│   Login.jsx      │ ──────────────────>  │  Backend API │
│                  │ <──────────────────  │              │
│  setUser(data)   │     user object      │              │
│  localStorage    │                      └──────────────┘
└──────────────────┘
         │
         ▼
┌──────────────────┐
│  AuthProvider     │
│  ├─ user state   │
│  ├─ login()      │
│  ├─ logout()     │
│  └─ loading      │
└──────────────────┘
         │
         ▼
┌──────────────────┐
│  ProtectedRoute  │  ★ ถ้าไม่มี user → redirect ไป /login
└──────────────────┘
```

**Key:**

- `localStorage` key: `thp_user`
- Auto-login: อ่าน cookie `thp_auto_login` + `thp_user_data`
- Logout: clear state + localStorage + cookies

---

## 11. Naming Conventions

### ไฟล์

| Type          | Convention                 | Example                  |
| ------------- | -------------------------- | ------------------------ |
| View (หน้าจอ) | `PascalCase.jsx`           | `ShipmentManagement.jsx` |
| SubView (Tab) | `PascalCase + Tab.jsx`     | `CreateShipmentTab.jsx`  |
| Component     | `PascalCase.jsx`           | `StatusBadge.jsx`        |
| Context       | `PascalCase + Context.jsx` | `AuthContext.jsx`        |
| Service       | `camelCase.js`             | `api.js`                 |
| Utility       | `camelCase.js`             | `cropImage.js`           |

### ตัวแปรและ Functions

```javascript
// ★ Components — PascalCase
const StatusBadge = () => {};
const MainLayout = () => {};

// ★ Functions / Variables — camelCase
const handleSubmit = () => {};
const formData = {};
const isLoading = false;

// ★ Constants — UPPER_SNAKE_CASE
const API_BASE_URL = "...";
const API_KEY = "...";

// ★ Event handlers — handle + Action
const handleClick = () => {};
const handleFormSubmit = () => {};
const handleDelete = () => {};

// ★ Boolean — is/has prefix
const isLoading = true;
const hasPermission = false;
const isAuthenticated = !!user;
```

---

## 12. Icon Usage

> ★ ใช้ **@mui/icons-material** เท่านั้น — ห้ามเพิ่ม icon library อื่น

```jsx
// ★ Import แบบ named import (tree-shaking friendly)
import LogoutIcon from '@mui/icons-material/Logout';
import SettingsIcon from '@mui/icons-material/Settings';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import RefreshIcon from '@mui/icons-material/Refresh';

// ★ ปรับขนาดด้วย sx prop
<SettingsIcon sx={{ fontSize: 20 }} />
<RefreshIcon sx={{ fontSize: '1.2rem' }} />
```

**ค้นหา Icon ได้ที่**: [https://mui.com/material-ui/material-icons/](https://mui.com/material-ui/material-icons/)

---

## 13. Notification & Dialog

### 13.1 SweetAlert2 — Alert / Confirm / Toast

```jsx
import Swal from "sweetalert2";

// ★ Success
Swal.fire("สำเร็จ!", "บันทึกเรียบร้อย", "success");

// ★ Error
Swal.fire({ icon: "error", title: "Error", text: "ไม่สามารถบันทึกได้" });

// ★ Confirm ก่อนลบ
const result = await Swal.fire({
  title: "ยืนยันการลบ?",
  text: "ข้อมูลจะถูกลบถาวร",
  icon: "warning",
  showCancelButton: true,
  confirmButtonColor: "#ED1C24",
  confirmButtonText: "ลบ",
  cancelButtonText: "ยกเลิก",
});
if (result.isConfirmed) {
  // ดำเนินการลบ
}
```

### 13.2 MUI Dialog — Complex Forms / Search

```jsx
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";

<Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
  <DialogTitle>ค้นหาลูกค้า</DialogTitle>
  <DialogContent>{/* ... form content ... */}</DialogContent>
  <DialogActions>
    <Button onClick={handleClose}>ยกเลิก</Button>
    <Button variant="contained" onClick={handleSave}>
      บันทึก
    </Button>
  </DialogActions>
</Dialog>;
```

### เมื่อไหร่ใช้อะไร?

| Scenario                      | ใช้                       |
| ----------------------------- | ------------------------- |
| แจ้งเตือน Success / Error     | **SweetAlert2**           |
| ยืนยันก่อน Action (ลบ/ยกเลิก) | **SweetAlert2** (confirm) |
| ฟอร์มซับซ้อน / ค้นหา          | **MUI Dialog**            |
| Popup ที่มี Table / List      | **MUI Dialog**            |

---

## 14. Coding Rules & Best Practices

### ✅ ต้องทำ

1. **ทุก component ต้อง import MUI** จาก `@mui/material` เป็นหลัก
2. **ใช้ `sx` prop** ในการ style MUI components
3. **Loading state** ทุกครั้งที่เรียก API
4. **Error handling** ด้วย `try/catch/finally`
5. **Optional chaining** (`?.`) เพื่อป้องกัน null errors
6. **ใช้ `endpoints`** จาก `services/api.js` ในการเรียก API
7. **แยกไฟล์** เมื่อ component มีขนาดเกิน ~300 บรรทัด
8. **ใช้ `variant` ที่เหมาะ** กับ Typography (`h4`, `h5`, `h6`, `body1`, `body2`, `subtitle1`, `subtitle2`)

### ❌ ห้ามทำ

1. ❌ ห้าม hardcode สี — ใช้ theme tokens
2. ❌ ห้ามใช้ `fetch()` ตรง — ใช้ `api.js`
3. ❌ ห้ามติดตั้ง icon library อื่น — ใช้ `@mui/icons-material`
4. ❌ ห้ามใช้ `textTransform: 'uppercase'` บน Button (ตั้งไว้ใน theme แล้ว)
5. ❌ ห้ามใช้ Tailwind classes บน MUI component โดยตรง
6. ❌ ห้ามเขียน `console.log` ทิ้งไว้ใน production code
7. ❌ ห้ามเก็บ API key ใน component — ให้อยู่ใน `api.js` ที่เดียว

---

## 15. Performance Tips

### 15.1 Import เฉพาะที่ใช้

```jsx
// ✅ Named import (tree-shaking)
import { Button, Box, Typography } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";

// ❌ ห้าม wildcard import
import * as MUI from "@mui/material";
```

### 15.2 Debounce สำหรับ Search

```jsx
// ★ Pattern: debounce 500ms สำหรับ search field
useEffect(() => {
  const timer = setTimeout(() => {
    if (searchQuery) {
      endpoints.searchCustomer(searchQuery).then(setResults);
    }
  }, 500);
  return () => clearTimeout(timer);
}, [searchQuery]);
```

### 15.3 Conditional Rendering

```jsx
// ✅ ใช้ short-circuit
{
  loading && <CircularProgress />;
}
{
  error && <Alert severity="error">{error}</Alert>;
}
{
  data && <DataTable rows={data} />;
}
```

---

## 📝 สรุป Quick Reference

```text
┌──────────────────────────────────────────────────┐
│  main.jsx   →  Theme + ThemeProvider             │
│  App.jsx    →  BrowserRouter + Routes            │
│  views/     →  หน้าจอหลัก (1 route = 1 file)    │
│  subviews/  →  Tab content / sections            │
│  component/ →  Reusable UI components            │
│  context/   →  Global state (Auth, etc.)         │
│  services/  →  API layer (Axios)                 │
│  utils/     →  Pure utility functions            │
└──────────────────────────────────────────────────┘

Styling:  MUI sx → Theme → Tailwind (เสริม)
State:    useState → Context → localStorage
API:      services/api.js → endpoints → try/catch
Alert:    SweetAlert2 (แจ้งเตือน) | MUI Dialog (ฟอร์ม)
Icons:    @mui/icons-material ONLY
Fonts:    Kanit (หัว) | Sarabun (body) | Noto Sans Thai (fallback)
```

---

> **เอกสารนี้อัพเดตล่าสุด**: 24 กุมภาพันธ์ 2569
>
> **ผู้จัดทำ**: ทีม SXD Express Development
