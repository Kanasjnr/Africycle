# Frontend Documentation

This document provides detailed information about the Africycle frontend application, built with Next.js 14 and TypeScript.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Key Features](#key-features)
- [Development Guide](#development-guide)
- [Component Library](#component-library)
- [State Management](#state-management)
- [Testing](#testing)
- [Performance](#performance)
- [Deployment](#deployment)

## Overview

The Africycle frontend is a modern web application that provides a user-friendly interface for:
- Waste collection management
- Collection point operations
- Recycler dashboard
- Corporate sustainability tracking
- User authentication and wallet connection

## Architecture

### Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **State Management**: React Query, Context API
- **Web3 Integration**: Wagmi, RainbowKit
- **Database**: Prisma
- **Testing**: Jest, React Testing Library
- **Code Quality**: ESLint, Prettier
- **Forms**: React Hook Form, Zod

### Key Dependencies

```json
{
  "dependencies": {
    "next": "14.1.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "@prisma/client": "latest",
    "@tanstack/react-query": "^5.0.0",
    "wagmi": "^2.0.0",
    "rainbowkit": "^2.0.0",
    "react-hook-form": "^7.0.0",
    "zod": "^3.0.0"
  },
  "devDependencies": {
    "prisma": "latest",
    "jest": "latest",
    "@testing-library/react": "latest",
    "@testing-library/jest-dom": "latest",
    "eslint": "latest",
    "prettier": "latest",
    "postcss": "latest",
    "tailwindcss": "latest"
  }
}
```

## Project Structure

```
packages/react-app/
├── app/                    # Next.js app directory (App Router)
├── ABI/                    # Smart contract ABIs
├── components/            # React components
│   ├── ui/               # UI components (shadcn/ui)
│   ├── forms/            # Form components
│   └── dashboard/        # Dashboard components
├── generated/            # Generated files (e.g., contract types)
├── hooks/                # Custom React hooks
├── lib/                  # Utility functions and shared logic
├── prisma/              # Database schema and migrations
├── providers/           # Context providers
├── public/              # Static assets
├── styles/              # Global styles
├── .next/               # Next.js build output
├── components.json      # shadcn/ui configuration
├── jest.config.js       # Jest configuration
├── jest.setup.js        # Jest setup and global mocks
├── next.config.js       # Next.js configuration
├── postcss.config.js    # PostCSS configuration
├── tailwind.config.js   # Tailwind CSS configuration
└── tsconfig.json        # TypeScript configuration
```

## Key Features

### 1. Authentication & Wallet Connection

```typescript
// Example: Wallet connection hook
export function useWallet() {
  const { connect, disconnect, isConnected, address } = useAccount();
  const { chain } = useNetwork();
  
  return {
    connect,
    disconnect,
    isConnected,
    address,
    chain,
    // ... other wallet utilities
  };
}
```

### 2. Dashboard Components

- Collector Dashboard
- Collection Point Dashboard
- Recycler Dashboard
- Corporate Dashboard

### 3. Form Handling

```typescript
// Example: Collection form
const CollectionForm = () => {
  const form = useForm<CollectionFormData>({
    resolver: zodResolver(collectionSchema),
    defaultValues: {
      amount: 0,
      type: 'plastic',
      location: '',
    },
  });

  const onSubmit = async (data: CollectionFormData) => {
    // Handle form submission
  };

  return (
    <Form {...form}>
      {/* Form fields */}
    </Form>
  );
};
```

## Development Guide

### Getting Started

1. **Environment Setup**
   ```bash
   # Install dependencies
   yarn install
   
   # Set up Prisma
   yarn prisma generate
   yarn prisma db push
   
   # Start development server
   yarn dev
   ```

2. **Code Style**
   - Use TypeScript for all new code
   - Follow ESLint and Prettier rules (configured in .eslintrc.json and .prettierrc)
   - Use functional components
   - Implement proper error handling
   - Run tests before committing: `yarn test`

### Component Development

1. **Creating a New Component**
   ```typescript
   // components/ui/Button.tsx
   import { ButtonProps } from '@/types';
   
   export const Button = ({
     variant = 'default',
     size = 'md',
     children,
     ...props
   }: ButtonProps) => {
     return (
       <button
         className={cn(
           'rounded-md font-medium',
           variants[variant],
           sizes[size]
         )}
         {...props}
       >
         {children}
       </button>
     );
   };
   ```

2. **Component Testing**
   ```typescript
   // components/ui/Button.test.tsx
   describe('Button', () => {
     it('renders correctly', () => {
       render(<Button>Click me</Button>);
       expect(screen.getByRole('button')).toBeInTheDocument();
     });
   });
   ```

## Component Library

### UI Components

1. **Button**
   - Variants: primary, secondary, outline
   - Sizes: sm, md, lg
   - States: loading, disabled

2. **Card**
   - Variants: default, elevated
   - Header and footer support
   - Custom content areas

3. **Form Components**
   - Input
   - Select
   - Checkbox
   - Radio
   - DatePicker

### Dashboard Components

1. **Stats Card**
   ```typescript
   interface StatsCardProps {
     title: string;
     value: number;
     change: number;
     trend: 'up' | 'down';
   }
   ```

2. **Collection Table**
   ```typescript
   interface CollectionTableProps {
     data: Collection[];
     onVerify: (id: string) => void;
     onReject: (id: string) => void;
   }
   ```

## State Management

### React Query

```typescript
// hooks/useCollections.ts
export function useCollections() {
  return useQuery({
    queryKey: ['collections'],
    queryFn: fetchCollections,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
```

### Context Providers

```typescript
// providers/AppProvider.tsx
export function AppProvider({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <WagmiConfig config={wagmiConfig}>
        <RainbowKitProvider>
          {children}
        </RainbowKitProvider>
      </WagmiConfig>
    </QueryClientProvider>
  );
}
```

## Testing

### Test Configuration

The project uses Jest and React Testing Library for testing, configured in:
- `jest.config.js`: Main Jest configuration
- `jest.setup.js`: Global test setup and mocks

### Test Structure

```
packages/react-app/
├── __tests__/           # Test files
│   ├── components/      # Component tests
│   ├── hooks/          # Hook tests
│   └── integration/    # Integration tests
├── jest.config.js      # Jest configuration
└── jest.setup.js       # Jest setup
```

### Testing Guidelines

1. **Component Tests**
   - Test rendering
   - Test user interactions
   - Test error states
   - Test loading states

2. **Hook Tests**
   - Test state changes
   - Test side effects
   - Test error handling

3. **Integration Tests**
   - Test form submissions
   - Test API interactions
   - Test wallet connections

## Performance

### Optimization Techniques

1. **Code Splitting**
   - Dynamic imports
   - Route-based splitting
   - Component lazy loading

2. **Image Optimization**
   - Next.js Image component
   - Proper image sizing
   - WebP format

3. **Caching**
   - React Query caching
   - Static page generation
   - API response caching

### Performance Monitoring

1. **Metrics to Track**
   - First Contentful Paint (FCP)
   - Largest Contentful Paint (LCP)
   - Time to Interactive (TTI)
   - First Input Delay (FID)

2. **Tools**
   - Lighthouse
   - Web Vitals
   - Performance Monitor

## Deployment

### Build Process

```bash
# Build the application
yarn build

# Start production server
yarn start
```

### Environment Configuration

1. **Required Variables**
   ```env
   NEXT_PUBLIC_CELO_RPC_URL=
   NEXT_PUBLIC_CONTRACT_ADDRESS=
   NEXT_PUBLIC_WC_PROJECT_ID=
   ```

2. **Optional Variables**
   ```env
   NEXT_PUBLIC_GA_ID=
   NEXT_PUBLIC_SENTRY_DSN=
   ```

### Deployment Platforms

1. **Vercel (Recommended)**
   - Automatic deployments
   - Preview deployments
   - Edge functions

2. **Self-hosted**
   - Docker container
   - Nginx configuration
   - SSL setup

## Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com)
- [Prisma Documentation](https://www.prisma.io/docs)
- [React Query Documentation](https://tanstack.com/query/latest)
- [Wagmi Documentation](https://wagmi.sh/docs)
- [Jest Documentation](https://jestjs.io/docs) 