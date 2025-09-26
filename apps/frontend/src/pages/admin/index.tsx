import React from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  Alert,
} from '@mui/material';
import { AdminLayout } from '../../components/layout/AdminLayout';
import ContentHeader from '../../components/layout/ContentHeader';
import { mockAuthContext } from '../../lib/auth';

interface DashboardStats {
  players: number;
  users: number;
  properties: number;
}

// Mock API call - in real app would fetch from /admin/dashboard endpoint
const mockStats: DashboardStats = {
  players: 1250,
  users: 15,
  properties: 2,
};

function StatCard({ title, value, unit }: { title: string; value: number; unit?: string }) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Typography color="textSecondary" gutterBottom>
          {title}
        </Typography>
        <Typography variant="h4">
          {value.toLocaleString()}
          {unit && <Typography component="span" variant="h6" color="textSecondary"> {unit}</Typography>}
        </Typography>
      </CardContent>
    </Card>
  );
}

function UserPropertiesList({ user }: { user: typeof mockAuthContext.user }) {
  if (!user?.properties.length) {
    return (
      <Alert severity="info">
        No properties assigned to your account.
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Your Properties
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {user.properties.map((property) => (
          <Chip
            key={property.id}
            label={`${property.name} - ${property.location}`}
            variant="outlined"
            color="primary"
          />
        ))}
      </Box>
    </Box>
  );
}

export default function AdminDashboard() {
  const { user } = mockAuthContext;

  return (
    <AdminLayout>
      <ContentHeader
        title="Admin Dashboard"
        subtitle="Overview of system statistics and your properties"
      />

      <Grid container spacing={3}>
        {/* Stats Cards */}
        <Grid item xs={12} md={4}>
          <StatCard title="Total Players" value={mockStats.players} />
        </Grid>
        <Grid item xs={12} md={4}>
          <StatCard title="System Users" value={mockStats.users} />
        </Grid>
        <Grid item xs={12} md={4}>
          <StatCard title="Properties" value={mockStats.properties} />
        </Grid>

        {/* User Properties */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <UserPropertiesList user={user} />
            </CardContent>
          </Card>
        </Grid>

        {/* Access Control Info */}
        <Grid item xs={12}>
          <Alert severity="success">
            <strong>Admin Access Active:</strong> You have full access to all system functions and properties.
          </Alert>
        </Grid>
      </Grid>
    </AdminLayout>
  );
}