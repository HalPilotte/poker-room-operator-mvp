import React from 'react';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Avatar,
  Chip,
} from '@mui/material';
import {
  Dashboard,
  People,
  Business,
  Settings,
  ExitToApp,
} from '@mui/icons-material';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { mockAuthContext, requireAdmin, type User } from '../../lib/auth';

const DRAWER_WIDTH = 240;

interface AdminLayoutProps {
  children: React.ReactNode;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  requiredRole?: string;
}

const navigationItems: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/admin',
    icon: <Dashboard />,
    requiredRole: 'ADMIN',
  },
  {
    label: 'Users',
    href: '/admin/users',
    icon: <People />,
    requiredRole: 'ADMIN',
  },
  {
    label: 'Properties',
    href: '/admin/properties',
    icon: <Business />,
    requiredRole: 'ADMIN',
  },
  {
    label: 'Settings',
    href: '/admin/settings',
    icon: <Settings />,
    requiredRole: 'ADMIN',
  },
];

function UserInfo({ user }: { user: User }) {
  return (
    <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
      <Avatar sx={{ width: 40, height: 40 }}>
        {user.firstName.charAt(0)}{user.lastName.charAt(0)}
      </Avatar>
      <Box sx={{ flex: 1 }}>
        <Typography variant="subtitle2">
          {user.firstName} {user.lastName}
        </Typography>
        <Chip 
          label={user.role} 
          size="small" 
          color={user.role === 'ADMIN' ? 'primary' : 'default'} 
        />
      </Box>
    </Box>
  );
}

function Navigation({ user }: { user: User }) {
  const router = useRouter();

  const filteredItems = navigationItems.filter(item => {
    if (!item.requiredRole) return true;
    return user.role === item.requiredRole;
  });

  return (
    <List>
      {filteredItems.map((item) => (
        <ListItem key={item.href} disablePadding>
          <ListItemButton
            component={Link}
            href={item.href}
            selected={router.pathname === item.href}
            sx={{
              '&.Mui-selected': {
                backgroundColor: 'primary.main',
                color: 'white',
                '&:hover': {
                  backgroundColor: 'primary.dark',
                },
                '& .MuiListItemIcon-root': {
                  color: 'white',
                },
              },
            }}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} />
          </ListItemButton>
        </ListItem>
      ))}
    </List>
  );
}

function AdminAppBar() {
  return (
    <AppBar 
      position="fixed" 
      sx={{ 
        width: `calc(100% - ${DRAWER_WIDTH}px)`, 
        ml: `${DRAWER_WIDTH}px`,
        backgroundColor: 'background.paper',
        color: 'text.primary',
        boxShadow: 1,
      }}
    >
      <Toolbar>
        <Typography variant="h6" noWrap component="div">
          Command Center
        </Typography>
      </Toolbar>
    </AppBar>
  );
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const { user, isAuthenticated } = mockAuthContext;

  // In a real app, would redirect to login
  if (!isAuthenticated || !user || !requireAdmin(user)) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h4" color="error">
          Access Denied
        </Typography>
        <Typography variant="body1" sx={{ mt: 2 }}>
          You need administrator privileges to access this area.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex' }}>
      <AdminAppBar />
      
      <Drawer
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
          },
        }}
        variant="permanent"
        anchor="left"
      >
        <Toolbar />
        <UserInfo user={user} />
        <Navigation user={user} />
        
        {/* Logout */}
        <Box sx={{ mt: 'auto', p: 2 }}>
          <ListItemButton>
            <ListItemIcon>
              <ExitToApp />
            </ListItemIcon>
            <ListItemText primary="Logout" />
          </ListItemButton>
        </Box>
      </Drawer>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          bgcolor: 'background.default',
          p: 3,
          mt: 8, // Account for app bar height
        }}
      >
        {children}
      </Box>
    </Box>
  );
}