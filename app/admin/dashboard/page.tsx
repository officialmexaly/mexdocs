import { Suspense } from 'react';
import {
  BarChart3,
  FileText,
  FolderOpen,
  Users,
  Eye,
  TrendingUp,
  MessageSquare,
  Calendar,
} from 'lucide-react';

// This would fetch dashboard data from the API
async function getDashboardData() {
  // In production, this would call your API
  const response = await fetch(`${process.env.NEXTAUTH_URL}/api/admin/dashboard`, {
    cache: 'no-store',
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch dashboard data');
  }
  
  const data = await response.json();
  return data.data;
}

function StatsCard({ 
  title, 
  value, 
  icon: Icon, 
  change, 
  trend 
}: { 
  title: string;
  value: string | number;
  icon: any;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
}) {
  return (
    <div className="card">
      <div className="card-content p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value.toLocaleString()}</p>
            {change && (
              <p className={`text-xs mt-1 flex items-center ${
                trend === 'up' ? 'text-green-600' : 
                trend === 'down' ? 'text-red-600' : 
                'text-muted-foreground'
              }`}>
                {trend === 'up' && <TrendingUp className="w-3 h-3 mr-1" />}
                {change}
              </p>
            )}
          </div>
          <div className="p-3 bg-primary/10 rounded-lg">
            <Icon className="w-6 h-6 text-primary" />
          </div>
        </div>
      </div>
    </div>
  );
}

function DashboardLoading() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="card">
            <div className="card-content p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="w-20 h-4 bg-muted rounded animate-pulse" />
                  <div className="w-16 h-8 bg-muted rounded animate-pulse" />
                </div>
                <div className="w-12 h-12 bg-muted rounded-lg animate-pulse" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

async function DashboardContent() {
  const dashboardData = await getDashboardData();
  const { stats, topArticles, recentFeedback, recentActivity } = dashboardData;

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Articles"
          value={stats.articles.total}
          icon={FileText}
          change={`${stats.articles.recent} this week`}
          trend="up"
        />
        <StatsCard
          title="Published Articles"
          value={stats.articles.published}
          icon={Eye}
          change={`${stats.articles.drafts} drafts`}
        />
        <StatsCard
          title="Categories"
          value={stats.categories.total}
          icon={FolderOpen}
        />
        <StatsCard
          title="Total Users"
          value={stats.users.total}
          icon={Users}
          change={`${stats.users.recent} this week`}
          trend="up"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Articles */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold">Most Viewed Articles</h3>
          </div>
          <div className="card-content">
            <div className="space-y-4">
              {topArticles.map((article: any, index: number) => (
                <div key={article.id} className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium truncate">{article.title}</h4>
                    <p className="text-sm text-muted-foreground">
                      {article.category?.name}
                    </p>
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Eye className="w-4 h-4 mr-1" />
                    {article.view_count.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Feedback */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold">Recent Feedback</h3>
          </div>
          <div className="card-content">
            <div className="space-y-4">
              {recentFeedback.map((feedback: any) => (
                <div key={feedback.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{feedback.article.title}</span>
                    <span className={`text-sm ${
                      feedback.value === 1 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {feedback.value === 1 ? '👍 Helpful' : '👎 Not Helpful'}
                    </span>
                  </div>
                  {feedback.comment && (
                    <p className="text-sm text-muted-foreground">
                      "{feedback.comment}"
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    by {feedback.user.display_name}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold">Recent Activity</h3>
        </div>
        <div className="card-content">
          <div className="space-y-4">
            {recentActivity.map((activity: any) => (
              <div key={activity.id} className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <Calendar className="w-4 h-4 text-primary" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm">
                    <span className="font-medium">{activity.user?.display_name || 'System'}</span>
                    {' '}{activity.action}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(activity.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your knowledge base performance and activity.
        </p>
      </div>

      <Suspense fallback={<DashboardLoading />}>
        <DashboardContent />
      </Suspense>
    </div>
  );
}