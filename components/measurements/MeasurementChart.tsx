'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, TrendingUp, TrendingDown, Calendar, Scale } from 'lucide-react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js';
import { format, subMonths, isAfter, isBefore } from 'date-fns';
import { ja } from 'date-fns/locale';
import MeasurementForm from './MeasurementForm';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface Measurement {
  id: string;
  client_id: string;
  type: string;
  value: number;
  measured_at: string;
  client: {
    name: string;
  };
}

interface Client {
  id: string;
  name: string;
}

interface MeasurementChartProps {
  user: {
    id: string;
    name: string;
    role: 'admin' | 'staff';
  };
}

export default function MeasurementChart({ user }: MeasurementChartProps) {
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [startDate, setStartDate] = useState(format(subMonths(new Date(), 3), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    if (selectedClient) {
      fetchMeasurements();
    }
  }, [selectedClient, startDate, endDate]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setClients(data || []);
      if (data && data.length > 0) {
        setSelectedClient(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const fetchMeasurements = async () => {
    if (!selectedClient) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('measurements')
        .select(`
          *,
          client:clients!measurements_client_id_fkey(name)
        `)
        .eq('client_id', selectedClient)
        .gte('measured_at', startDate)
        .lte('measured_at', endDate + 'T23:59:59')
        .order('measured_at', { ascending: true });

      if (error) throw error;
      setMeasurements(data || []);
    } catch (error) {
      console.error('Error fetching measurements:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMeasurementSaved = () => {
    fetchMeasurements();
    setShowForm(false);
  };

  const chartData: ChartData<'line'> = {
    labels: measurements.map(m => 
      format(new Date(m.measured_at), 'M/d', { locale: ja })
    ),
    datasets: [
      {
        label: '体重 (kg)',
        data: measurements.map(m => m.value),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.1,
        pointRadius: 6,
        pointHoverRadius: 8,
      },
    ],
  };

  const chartOptions: ChartOptions<'line'> = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: '体重推移',
        font: {
          size: 16,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: false,
        title: {
          display: true,
          text: '体重 (kg)',
        },
      },
      x: {
        title: {
          display: true,
          text: '測定日',
        },
      },
    },
  };

  const getWeightTrend = () => {
    if (measurements.length < 2) return null;
    const first = measurements[0].value;
    const last = measurements[measurements.length - 1].value;
    const diff = last - first;
    return { diff, isDecrease: diff < 0 };
  };

  const trend = getWeightTrend();

  if (showForm) {
    return (
      <MeasurementForm
        clients={clients}
        selectedClientId={selectedClient}
        user={user}
        onSave={handleMeasurementSaved}
        onCancel={() => setShowForm(false)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">体重推移</h1>
          <p className="text-gray-600">顧客の体重変化をグラフで確認</p>
        </div>
        <Button
          onClick={() => setShowForm(true)}
          disabled={!selectedClient}
          className="bg-gradient-to-r from-blue-500 to-pink-500 hover:from-blue-600 hover:to-pink-600"
        >
          <Plus className="w-4 h-4 mr-2" />
          体重記録
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="client">顧客</Label>
              <Select value={selectedClient} onValueChange={setSelectedClient}>
                <SelectTrigger>
                  <SelectValue placeholder="顧客を選択" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="startDate">開始日</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="endDate">終了日</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!selectedClient ? (
            <div className="text-center py-8">
              <Scale className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">顧客を選択してください</p>
            </div>
          ) : loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              <p className="text-gray-500 mt-2">データを読み込み中...</p>
            </div>
          ) : measurements.length === 0 ? (
            <div className="text-center py-8">
              <Scale className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">選択した期間に体重データがありません</p>
              <Button
                onClick={() => setShowForm(true)}
                variant="outline"
                className="mt-4"
              >
                <Plus className="w-4 h-4 mr-2" />
                体重を記録する
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {trend && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">期間内変化</p>
                          <p className="text-2xl font-bold">
                            {trend.diff > 0 ? '+' : ''}{trend.diff.toFixed(1)}kg
                          </p>
                        </div>
                        {trend.isDecrease ? (
                          <TrendingDown className="w-8 h-8 text-green-500" />
                        ) : (
                          <TrendingUp className="w-8 h-8 text-red-500" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">最新体重</p>
                          <p className="text-2xl font-bold">
                            {measurements[measurements.length - 1].value}kg
                          </p>
                        </div>
                        <Scale className="w-8 h-8 text-blue-500" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">記録回数</p>
                          <p className="text-2xl font-bold">{measurements.length}回</p>
                        </div>
                        <Calendar className="w-8 h-8 text-purple-500" />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              <Card>
                <CardContent className="p-6">
                  <Line data={chartData} options={chartOptions} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>測定履歴</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {measurements.slice().reverse().map((measurement) => (
                      <div
                        key={measurement.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="font-medium">
                            {format(new Date(measurement.measured_at), 'yyyy年M月d日', { locale: ja })}
                          </span>
                        </div>
                        <Badge variant="secondary" className="text-lg font-semibold">
                          {measurement.value}kg
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}