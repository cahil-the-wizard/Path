# Path

A React Native desktop task management application built with React Native Web.

## Overview

Path is a task breakdown and productivity app that helps users manage complex tasks by breaking them down into smaller, manageable steps. The application features a clean, modern interface with a collapsible sidebar navigation and multiple views for organizing your work.

## Features

### Pages

- **Today** - View your daily tasks and upcoming steps with progress indicators
- **New Task** - Create new tasks with a simple, focused interface
- **Task Detail** - View and manage individual tasks with step-by-step breakdowns
- **Calendar** - (Coming soon)

### Navigation

- Collapsible sidebar with smooth animations
- Quick access to main views (Today, Calendar, Add Task)
- Task list with navigation to individual task detail pages
- Active state indicators for current page/task

### Task Management

- Break down tasks into individual steps
- Track completion status for each step
- Split complex steps into smaller substeps
- Visual progress indicators (e.g., "2 of 5 steps complete")
- Step descriptions and time estimates

### UI Components

- **PageHeader** - Sticky header with scroll-based border animation
- **Step** - Complete/incomplete step variants with split functionality
- **TodayCard** - Daily task card with step indicators and chips
- **Button** - Multiple variants (primary, secondary, tertiary, ghost, subtle) with hover states
- **Navbar** - Collapsible navigation with animation (240px → 60px)
- **NavItem** - Navigation items with active/hover states
- **Chip** - Labels with icons for categorization
- **TextInput** - Form input component

## Tech Stack

- **React Native** (0.73.0) - Mobile-first development framework
- **React Native Web** - Web compatibility layer
- **TypeScript** - Type-safe development
- **Webpack 5** - Module bundling and dev server
- **Babel** - JavaScript transpilation
- **Lucide React Native** - Icon library

## Design System

### Colors

- **Gray scales** - Light and dark variants for UI elements
- **Brand colors** - Indigo for primary actions and highlights
- **Status colors** - Success (green), Error (red), Warning (yellow)

### Typography

- **Futura** - Display headings (Hero, Page titles)
- **Inter** - Body text, UI elements, navigation
- **Roboto Mono** - Code snippets

### Layout

- **Sticky navbar** - Fixed width navigation that stays visible while scrolling
- **Responsive content** - Max-width containers (600px) for optimal readability
- **Smooth animations** - Navbar collapse/expand with opacity transitions

## Getting Started

### Prerequisites

- Node.js (v14 or higher recommended)
- npm or yarn

### Installation

```bash
npm install
```

### Development

Run the development server:

```bash
npm run web
```

The app will be available at `http://localhost:3000`

## Project Structure

```
Path/
├── public/
│   └── index.html          # HTML template with Google Fonts
├── src/
│   ├── components/         # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── Navbar.tsx
│   │   ├── NavItem.tsx
│   │   ├── PageHeader.tsx
│   │   ├── Step.tsx
│   │   ├── TextInput.tsx
│   │   ├── TodayCard.tsx
│   │   ├── Chip.tsx
│   │   └── CardStepIndicator.tsx
│   ├── pages/              # Main application views
│   │   ├── Today.tsx
│   │   ├── NewTask.tsx
│   │   └── TaskDetail.tsx
│   └── theme/
│       └── tokens.ts       # Design system tokens
├── App.tsx                 # Main app component with routing
├── index.js                # Entry point
├── webpack.config.js       # Webpack configuration
├── babel.config.js         # Babel configuration
├── tsconfig.json           # TypeScript configuration
└── package.json
```

## Configuration

### Webpack

- Configured for React Native Web compatibility
- Hot module replacement enabled
- Development server on port 3000
- Flow type stripping for React Native packages

### Babel

- React Native preset
- TypeScript support
- Flow type stripping
- Class properties with loose mode

## Browser Support

The application is optimized for modern web browsers with support for:
- CSS Grid and Flexbox
- Sticky positioning
- CSS animations and transitions
- ES6+ JavaScript features

## License

This project is private and not licensed for public use.
