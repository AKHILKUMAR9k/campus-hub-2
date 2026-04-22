'use client';

import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  Users, 
  Calendar, 
  Target, 
  TrendingUp,
  Award
} from 'lucide-react';
import StatCard from './stat-card';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface AnalyticsDashboardProps {
  stats: {
    totalEvents: number;
    totalUsers: number;
    totalClubs: number;
    pendingClubs: number;
    avgEngagement?: number;
  };
  trends: { date: string; count: number }[];
  popularEvents: { name: string; value: number }[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function AnalyticsDashboard({ stats, trends, popularEvents }: AnalyticsDashboardProps) {
  return (
    <div className="space-y-8">
      {/* Stat Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Users"
          value={stats.totalUsers}
          icon={Users}
          description="Registered students"
        />
        <StatCard
          title="Total Events"
          value={stats.totalEvents}
          icon={Calendar}
          description="All time events"
        />
        <StatCard
          title="Active Clubs"
          value={stats.totalClubs}
          icon={Target}
          description={`${stats.pendingClubs} pending approval`}
        />
        <StatCard
          title="Avg. Engagement"
          value={stats.avgEngagement ? `${stats.avgEngagement}${stats.avgEngagement < 100 ? '%' : ''}` : "0%"}
          icon={TrendingUp}
          description={stats.avgEngagement && stats.avgEngagement < 100 ? "Unique user registration rate" : "Average registrations per event"}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        
        {/* Registration Trends Chart */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Registration Trends</CardTitle>
            <CardDescription>Event registrations over the last 30 days</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={trends}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  stroke="#888888" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return `${date.getMonth() + 1}/${date.getDate()}`;
                  }}
                />
                <YAxis 
                   stroke="#888888" 
                   fontSize={12} 
                   tickLine={false} 
                   axisLine={false} 
                   tickFormatter={(value) => `${value}`} 
                />
                <Tooltip 
                    cursor={{ fill: 'transparent' }}
                    contentStyle={{ borderRadius: '8px' }}
                />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Popular Events Chart */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Top Popular Events</CardTitle>
            <CardDescription>By registration count</CardDescription>
          </CardHeader>
          <CardContent>
            {popularEvents.length > 0 ? (
                 <div className="space-y-4">
                    {popularEvents.map((event, index) => (
                        <div key={index} className="flex items-center">
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-sm font-bold mr-3">
                                {index + 1}
                            </div>
                            <div className="flex-1 space-y-1">
                                <p className="text-sm font-medium leading-none">{event.name}</p>
                                <div className="w-full bg-secondary h-2 rounded-full mt-1">
                                    <div 
                                        className="bg-primary h-2 rounded-full" 
                                        style={{ width: `${(event.value / popularEvents[0].value) * 100}%` }} 
                                    />
                                </div>
                            </div>
                            <div className="ml-4 font-medium text-sm">{event.value}</div>
                        </div>
                    ))}
                 </div>
            ) : (
                <div className="flex h-[350px] items-center justify-center text-muted-foreground">
                    No data available
                </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
