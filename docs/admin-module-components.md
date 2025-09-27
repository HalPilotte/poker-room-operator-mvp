# Admin Module Component Index

This document provides an inventory of all components in the admin module, following the architecture defined in ADR-001.

## Component Hierarchy

### Layout Components
Located in `apps/frontend/src/components/layout/`

#### ContentHeader
**File**: `ContentHeader.tsx`  
**Purpose**: Standardized page headers with title and optional subtitle  
**Props**:
- `title: string` - Main page title
- `subtitle?: string` - Optional descriptive text

**Usage**: Used across all admin pages for consistent header styling

### Form Components
Located in `apps/frontend/src/components/forms/`

#### PlayerForm
**File**: `PlayerForm.tsx`  
**Purpose**: Complete player registration and editing form  
**Schema**: Defined in `playerFormSchema.ts` using Zod  
**Storybook**: Available at `PlayerForm.stories.tsx`  

**Features**:
- Full player information capture
- Real-time validation with React Hook Form
- Consent tracking and compliance
- Status management (Active/Inactive)
- Phone number validation
- Date of birth handling

**Form Fields**:
- `first_name` (required)
- `last_name` (required)  
- `alias` (optional)
- `date_of_birth` (required)
- `address` (optional)
- `phone` (optional, validated format)
- `consent` (required checkbox)
- `notes` (optional textarea)
- `status` (select: Active/Inactive)

#### Supporting Form Components

##### Field.tsx
Reusable form field wrapper with consistent styling

##### FormBanner.tsx
Displays form-level messages and alerts

##### SubmitBar.tsx
Standardized form submission area with consistent button styling

### Utility Components
Located in `apps/frontend/src/lib/`

#### API Integration (`api.ts`)
- Centralized HTTP client
- Automatic JSON handling
- Consistent error formatting
- Base URL configuration via environment variables

#### Snackbar Utility (`snackbar.tsx`)
- Toast notifications for user feedback
- Success, error, info, and warning variants
- Auto-dismissing with customizable timing
- Material-UI Alert integration

## Pages
Located in `apps/frontend/src/pages/`

### Player Management

#### `/players/new`
**File**: `players/new.tsx`  
**Purpose**: New player registration page  
**Components Used**:
- `ContentHeader` - Page title and description
- `PlayerForm` - Main registration form
- `useSnackbar` - Success/error feedback

**API Integration**: POST `/players` endpoint

### Application Layout

#### `_app.tsx`
Global application wrapper providing:
- React Query client configuration
- Material-UI CSS baseline
- Container layout with responsive sizing
- Global providers and context

## Schemas and Validation
Located in `apps/frontend/src/components/forms/`

### playerFormSchema.ts
Zod schema defining player form validation rules:
- Required field validation
- Phone number format validation
- Date validation
- Custom error messages
- TypeScript type generation

## Storybook Documentation

### Available Stories
- `Forms/PlayerForm` - Interactive player form documentation
  - Default state with demo data
  - Form validation examples
  - Submission handling demonstration

### Component Documentation Standards
Following ADR-001 requirements:
- All components have TypeScript interfaces
- Storybook stories document usage patterns
- Interactive examples show real functionality
- Props documentation via TypeScript types

## Current Feature Coverage

### ✅ Implemented
- **Player Management**: Complete CRUD interface
- **Form Validation**: Zod schemas with React Hook Form
- **API Integration**: RESTful endpoints with error handling
- **UI Consistency**: Material-UI design system
- **Component Documentation**: Storybook integration

### 🚧 In Progress (Future Sub-Issues)
- **Table Management**: Table configuration and monitoring
- **Tournament System**: Tournament creation and management
- **Financial Operations**: Transaction processing
- **Staff Management**: User roles and permissions
- **System Configuration**: Settings interface

## Testing Coverage

### Current Testing
- **TypeScript**: Compile-time type checking
- **Storybook**: Component documentation and visual testing
- **Unit Tests**: `PlayerForm.spec.ts` for form component testing

### Testing Standards (Per ADR-001)
- All new components require unit tests
- Form components require validation testing
- API integration requires mocking
- Critical flows require integration tests

## Migration Notes

Components follow the architectural patterns established in ADR-001:
1. **Type Safety**: Full TypeScript coverage
2. **Validation**: Zod schemas for runtime validation
3. **Styling**: Material-UI components and theming
4. **State Management**: React Hook Form for forms, React Query for server state
5. **Documentation**: Storybook for component documentation

## Contributing

When adding new components:
1. Follow the established directory structure
2. Include TypeScript interfaces and proper typing
3. Add Storybook stories for documentation
4. Include unit tests for functionality
5. Follow Material-UI design patterns
6. Update this index when adding new components