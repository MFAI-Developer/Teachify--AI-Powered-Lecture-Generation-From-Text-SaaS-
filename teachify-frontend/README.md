# Teachify Frontend

A modern, professional frontend for the Teachify AI-powered lecture video generation platform.

## 🚀 Features

- **Beautiful UI**: Clean, academic design with Indigo/Sky color scheme
- **Full Authentication**: JWT-based auth with access + refresh token management
- **Content Generation**: Create lectures from prompts or documents
- **Protected Routes**: Secure dashboard and user-specific pages
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **Type-Safe**: Built with TypeScript for reliability

## 🛠️ Tech Stack

- **React 18** with **Vite** for fast development
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **React Router** for navigation
- **Axios** for API calls with automatic token refresh
- **shadcn/ui** components for consistent UI

## 📋 Prerequisites

- Node.js 16+ and npm
- Teachify backend running (default: `http://localhost:8000`)

## 🏃 Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Create a `.env` file in the root directory:

```bash
VITE_API_BASE_URL=http://localhost:8000
```

### 3. Run Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:8080`

### 4. Build for Production

```bash
npm run build
```

## 📁 Project Structure

```
src/
├── api/              # API client and auth utilities
│   ├── http.ts       # Axios instance with interceptors
│   ├── auth.ts       # Authentication API calls
│   └── content.ts    # Content generation API calls
├── components/       # Reusable components
│   ├── ui/          # shadcn UI components
│   ├── Navbar.tsx
│   ├── Footer.tsx
│   └── ProtectedRoute.tsx
├── context/         # React context providers
│   └── AuthContext.tsx
├── pages/           # Page components
│   ├── Home.tsx
│   ├── Login.tsx
│   ├── Signup.tsx
│   ├── Dashboard.tsx
│   ├── GeneratePrompt.tsx
│   ├── GenerateDocs.tsx
│   ├── LecturePlayer.tsx
│   ├── History.tsx
│   ├── Profile.tsx
│   ├── Billing.tsx
│   ├── Pricing.tsx
│   ├── NotFound.tsx
│   ├── About.tsx
│   ├── Privacy.tsx
│   └── Terms.tsx
└── App.tsx          # Main app with routing
```

## 🔐 Authentication Flow

1. **Login**: Uses form-urlencoded OAuth2 password flow
2. **Token Storage**: Access and refresh tokens stored in localStorage
3. **Auto-Refresh**: Axios interceptor automatically refreshes expired tokens
4. **Protected Routes**: Dashboard and generation pages require authentication

## 🎨 Design System

The app uses a professional, academic design with:

- **Primary**: Indigo 600/700 for main brand color
- **Accent**: Sky 500 for secondary actions
- **Typography**: Inter font with generous line-height
- **Spacing**: Rounded corners (rounded-2xl), soft shadows, airy spacing
- **Motion**: Subtle 150-200ms transitions

All colors are defined as HSL tokens in `src/index.css` and `tailwind.config.ts`.

## 🔌 API Endpoints

The frontend connects to these backend endpoints:

### Authentication
- `POST /auth/register` - Create account
- `POST /auth/login` - Sign in (form-urlencoded)
- `POST /auth/refresh` - Refresh access token
- `POST /auth/logout` - Sign out
- `GET /auth/profile` - Get user profile

### Content Generation
- `POST /v1/content/generate` - Generate from prompt
- `POST /v1/content/generate-from-docs` - Generate from documents (multipart)

## 🧪 Development Notes

### Token Management

Tokens are stored in localStorage:
- `teachify_access_token` - Short-lived access token
- `teachify_refresh_token` - Long-lived refresh token

The Axios response interceptor automatically:
1. Detects 401 errors
2. Calls refresh endpoint
3. Retries failed requests with new token
4. Redirects to login if refresh fails

### Environment Variables

- `VITE_API_BASE_URL` - Backend API base URL (default: http://localhost:8000)

## 📝 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🐛 Troubleshooting

### CORS Issues
Make sure backend allows requests from your frontend origin in CORS configuration.

### Token Issues
If you're logged out unexpectedly, check:
1. Backend is running and accessible
2. Token expiry times are configured correctly
3. Browser console for errors

### Build Errors
If you encounter TypeScript errors:
1. Clear node_modules and reinstall: `rm -rf node_modules && npm install`
2. Check that all imports are correct
3. Ensure backend types match frontend interfaces

## 📄 License

This project is part of the Teachify platform.

## 🤝 Support

For questions or issues, contact: fawad.khan.ai.developer@gmail.com
