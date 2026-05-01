import { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line,
} from 'recharts';
import { TrendingUp, ShoppingBag, CheckCircle2, PieChart as PieChartIcon, Map as MapIcon } from 'lucide-react';
import { Order, Language } from '../../types';
import { translations } from '../../translations';

interface Props {
  language: Language;
  orders: Order[];
}

const COLORS = ['#D4AF37', '#8E9299', '#FFFFFF', '#4A4A4A', '#151619'];

export default function AnalyticsTab({ language, orders }: Props) {
  const t = translations[language];

  const data = useMemo(() => {
    if (orders.length === 0) return null;

    const salesByDate: Record<string, number> = {};
    const itemsCount: Record<string, number> = {};
    const locationsCount: Record<string, number> = {};
    let totalRevenue = 0;

    orders.forEach((order) => {
      if (order.status === 'delivered') {
        const date = order.createdAt?.toDate().toLocaleDateString();
        if (date) salesByDate[date] = (salesByDate[date] || 0) + (order.totalPrice || 0);
        totalRevenue += order.totalPrice || 0;
      }
      itemsCount[order.itemName] = (itemsCount[order.itemName] || 0) + (order.quantity || 1);
      const loc = order.location?.split(',')[0]?.trim() || 'Unknown';
      locationsCount[loc] = (locationsCount[loc] || 0) + 1;
    });

    return {
      salesChartData: Object.entries(salesByDate).map(([date, amount]) => ({ date, amount })).reverse(),
      itemsChartData: Object.entries(itemsCount).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value),
      locationsChartData: Object.entries(locationsCount).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value),
      totalRevenue,
      totalOrders: orders.length,
      deliveredOrders: orders.filter((o) => o.status === 'delivered').length,
    };
  }, [orders]);

  const tooltipStyle = { backgroundColor: '#151619', border: '1px solid rgba(212,175,55,0.2)', borderRadius: '12px' };

  return (
    <div className="space-y-12">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { icon: <TrendingUp size={24} />, color: 'gold', label: t.admin.analytics.totalRevenue, value: `${data?.totalRevenue || 0} ETB` },
          { icon: <ShoppingBag size={24} />, color: 'blue-500', label: t.admin.analytics.totalOrders, value: data?.totalOrders || 0 },
          { icon: <CheckCircle2 size={24} />, color: 'green-500', label: t.admin.analytics.delivered, value: data?.deliveredOrders || 0 },
        ].map(({ icon, color, label, value }) => (
          <div key={label} className="bg-luxury-gray p-8 rounded-3xl border border-white/5">
            <div className="flex items-center gap-4 mb-4">
              <div className={`p-3 bg-${color}/10 text-${color} rounded-xl`}>{icon}</div>
              <span className="text-gray-400 font-medium">{label}</span>
            </div>
            <div className={`text-4xl font-bold ${color === 'gold' ? 'text-gold' : ''}`}>{value}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Sales line chart */}
        <div className="bg-luxury-gray p-8 rounded-3xl border border-white/5">
          <h3 className="text-xl font-bold mb-8 flex items-center gap-2">
            <TrendingUp size={20} className="text-gold" /> {t.admin.analytics.salesPerformance}
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data?.salesChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                <XAxis dataKey="date" stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${v} ETB`} />
                <Tooltip contentStyle={tooltipStyle} itemStyle={{ color: '#D4AF37' }} />
                <Line type="monotone" dataKey="amount" stroke="#D4AF37" strokeWidth={3} dot={{ fill: '#D4AF37', r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Popular items pie chart */}
        <div className="bg-luxury-gray p-8 rounded-3xl border border-white/5">
          <h3 className="text-xl font-bold mb-8 flex items-center gap-2">
            <PieChartIcon size={20} className="text-gold" /> {t.admin.analytics.popularItems}
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data?.itemsChartData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                  {data?.itemsChartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Locations bar chart */}
        <div className="bg-luxury-gray p-8 rounded-3xl border border-white/5 lg:col-span-2">
          <h3 className="text-xl font-bold mb-8 flex items-center gap-2">
            <MapIcon size={20} className="text-gold" /> {t.admin.analytics.orderLocations}
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.locationsChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                <XAxis dataKey="name" stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={tooltipStyle} />
                <Bar dataKey="value" fill="#D4AF37" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
