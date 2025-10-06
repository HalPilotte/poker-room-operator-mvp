# Admin Module Documentation

This directory contains detailed documentation for the Admin Module components and features.

## Overview

The Admin Module provides a comprehensive interface for poker room operators to manage all aspects of their operations. Based on [ADR-001](../ADR-001-Admin-Module.md), it follows modern React patterns with Material-UI design system.

## Architecture

```
Admin Module (apps/frontend)
├── Components/
│   ├── Forms/              # Player, Table, Tournament forms
│   ├── Layout/             # Headers, navigation, layout components  
│   └── Data/               # Lists, tables, data visualization
├── Pages/
│   ├── Players/            # Player management screens
│   ├── Tables/             # Table management screens
│   └── Tournaments/        # Tournament management screens
└── Lib/
    ├── API/                # API integration utilities
    ├── Validation/         # Form validation schemas
    └── Utils/              # Shared utilities
```

## Key Features

### Current Features
- **Player Management**: Registration, profiles, status tracking
- **Form Handling**: React Hook Form with Zod validation
- **API Integration**: RESTful API with error handling
- **UI Components**: Material-UI based design system

### Planned Features (Sub-issues of ADR-001)
- **Table Management**: Table configuration and monitoring
- **Tournament System**: Tournament creation and management
- **Financial Operations**: Transaction processing and reporting
- **Staff Management**: User roles and permissions
- **System Configuration**: Settings and integrations

## Development Guidelines

### Component Standards
- All components must have TypeScript interfaces
- Include Storybook stories for documentation
- Follow Material-UI design patterns
- Implement proper error boundaries

### Form Patterns
- Use React Hook Form for all forms
- Zod schemas for validation
- Consistent error message display
- Loading states and submission feedback

### API Integration
- Centralized API utilities in `lib/api.ts`
- Consistent error handling
- Loading state management with React Query
- Optimistic updates where appropriate

## Testing

### Current Testing Setup
- Jest for unit testing
- Storybook for component documentation
- TypeScript for compile-time checks

### Testing Requirements
- All new components require unit tests
- Critical flows require integration tests
- Forms require validation testing
- API integration requires mocking

## Sub-Issues and Tickets

All tickets related to the Admin Module should reference ADR-001 and follow the established patterns:

### High Priority
- [ ] Table Management Interface
- [ ] Tournament Creation Wizard
- [ ] Financial Transaction Processing
- [ ] Enhanced Player Features

### Medium Priority  
- [ ] Staff Management System
- [ ] Reporting and Analytics
- [ ] System Configuration Interface
- [ ] Mobile Responsiveness

### Future Considerations
- [ ] Real-time Updates Integration
- [ ] Advanced Security Features
- [ ] Multi-room Support
- [ ] Third-party Integrations

## Contributing

When working on Admin Module features:

1. Review ADR-001 for architectural guidance
2. Follow established component patterns
3. Add appropriate documentation and tests
4. Update this documentation for new features
5. Ensure consistency with existing UI patterns