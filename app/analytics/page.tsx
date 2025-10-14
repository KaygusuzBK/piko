'use client'

import { useState } from 'react'
import { useUserAnalyticsSummary, useAnalyticsChartData } from '@/hooks/useAnalytics'
import { useAuthStore } from '@/stores/authStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart
} from 'recharts'
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Eye, 
  Heart, 
  MessageCircle, 
  Repeat, 
  Target,
  Zap
} from 'lucide-react'
import type { AnalyticsFilters } from '@/lib/types'

const TIME_RANGES = [
  { label: 'Son 7 Gün', value: '7', days: 7 },
  { label: 'Son 30 Gün', value: '30', days: 30 },
  { label: 'Son 90 Gün', value: '90', days: 90 },
  { label: 'Son Yıl', value: '365', days: 365 }
]

const METRICS = [
  { value: 'profile_views', label: 'Profil Görüntülemeleri' },
  { value: 'post_impressions', label: 'Gönderi Görüntülemeleri' },
  { value: 'likes_received', label: 'Alınan Beğeniler' },
  { value: 'comments_received', label: 'Alınan Yorumlar' },
  { value: 'retweets_received', label: 'Alınan Retweetler' },
  { value: 'followers_gained', label: 'Kazanılan Takipçiler' },
  { value: 'posts_created', label: 'Oluşturulan Gönderiler' },
  { value: 'engagement_rate', label: 'Etkileşim Oranı' }
]

const CHART_COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00', '#ff00ff']

export default function AnalyticsDashboard() {
  const { user } = useAuthStore()
  const [timeRange, setTimeRange] = useState('30')
  const [selectedMetric, setSelectedMetric] = useState('profile_views')
  const [activeTab, setActiveTab] = useState('overview')

  const { data: summary, isLoading: summaryLoading } = useUserAnalyticsSummary(
    user?.id, 
    parseInt(timeRange)
  )

  const chartFilters: AnalyticsFilters = {
    timeRange,
    metric: selectedMetric,
    userId: user?.id
  }

  const { data: chartData, isLoading: chartLoading } = useAnalyticsChartData(chartFilters)

  const getMetricIcon = (metric: string) => {
    switch (metric) {
      case 'profile_views':
        return <Eye className="h-4 w-4" />
      case 'post_impressions':
        return <Eye className="h-4 w-4" />
      case 'likes_received':
        return <Heart className="h-4 w-4" />
      case 'comments_received':
        return <MessageCircle className="h-4 w-4" />
      case 'retweets_received':
        return <Repeat className="h-4 w-4" />
      case 'followers_gained':
        return <Users className="h-4 w-4" />
      case 'posts_created':
        return <Target className="h-4 w-4" />
      case 'engagement_rate':
        return <Zap className="h-4 w-4" />
      default:
        return <TrendingUp className="h-4 w-4" />
    }
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M'
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K'
    }
    return num.toString()
  }

  const formatPercentage = (num: number) => {
    return num.toFixed(1) + '%'
  }

  if (summaryLoading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-muted rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Hesabınızın performansını takip edin
          </p>
        </div>
        
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIME_RANGES.map((range) => (
                <SelectItem key={range.value} value={range.value}>
                  {range.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Profil Görüntülemeleri</p>
                  <p className="text-2xl font-bold">{formatNumber(summary.total_profile_views)}</p>
                </div>
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <Eye className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Gönderi Görüntülemeleri</p>
                  <p className="text-2xl font-bold">{formatNumber(summary.total_post_impressions)}</p>
                </div>
                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                  <Eye className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Toplam Etkileşim</p>
                  <p className="text-2xl font-bold">
                    {formatNumber(
                      summary.total_likes_received + 
                      summary.total_comments_received + 
                      summary.total_retweets_received
                    )}
                  </p>
                </div>
                <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                  <Heart className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Etkileşim Oranı</p>
                  <p className="text-2xl font-bold">{formatPercentage(summary.avg_engagement_rate)}</p>
                </div>
                <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                  <Zap className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Genel Bakış</TabsTrigger>
          <TabsTrigger value="engagement">Etkileşim</TabsTrigger>
          <TabsTrigger value="growth">Büyüme</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Performans Trendi</CardTitle>
                <Select value={selectedMetric} onValueChange={setSelectedMetric}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {METRICS.map((metric) => (
                      <SelectItem key={metric.value} value={metric.value}>
                        {metric.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                {chartLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(value) => new Date(value).toLocaleDateString('tr-TR', { 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      />
                      <YAxis />
                      <Tooltip 
                        labelFormatter={(value) => new Date(value).toLocaleDateString('tr-TR')}
                        formatter={(value: number) => [formatNumber(value), selectedMetric]}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="value" 
                        stroke="#8884d8" 
                        fill="#8884d8" 
                        fillOpacity={0.3}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="engagement" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Etkileşim Dağılımı</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Beğeniler', value: summary?.total_likes_received || 0 },
                          { name: 'Yorumlar', value: summary?.total_comments_received || 0 },
                          { name: 'Retweetler', value: summary?.total_retweets_received || 0 }
                        ]}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(props: { name: string; percent: number }) => `${props.name} ${(props.percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {[0, 1, 2].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Günlük Etkileşim</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(value) => new Date(value).toLocaleDateString('tr-TR', { 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      />
                      <YAxis />
                      <Tooltip 
                        labelFormatter={(value) => new Date(value).toLocaleDateString('tr-TR')}
                        formatter={(value: number) => [formatNumber(value), selectedMetric]}
                      />
                      <Bar dataKey="value" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="growth" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Takipçi Büyümesi</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium">Kazanılan Takipçiler</span>
                  </div>
                  <p className="text-2xl font-bold text-green-600">
                    +{formatNumber(summary?.total_followers_gained || 0)}
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="h-4 w-4 text-red-600" />
                    <span className="text-sm font-medium">Kaybedilen Takipçiler</span>
                  </div>
                  <p className="text-2xl font-bold text-red-600">
                    -{formatNumber(summary?.total_followers_lost || 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>En İyi Performans</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {summary?.best_performing_date && (
                  <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <div>
                      <p className="font-medium">En Yüksek Etkileşim Oranı</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(summary.best_performing_date).toLocaleDateString('tr-TR')}
                      </p>
                    </div>
                    <Badge variant="secondary">
                      {formatPercentage(summary.best_performing_engagement_rate)}
                    </Badge>
                  </div>
                )}
                
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div>
                    <p className="font-medium">Oluşturulan Gönderiler</p>
                    <p className="text-sm text-muted-foreground">Son {timeRange} gün</p>
                  </div>
                  <Badge variant="secondary">
                    {formatNumber(summary?.total_posts_created || 0)}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
