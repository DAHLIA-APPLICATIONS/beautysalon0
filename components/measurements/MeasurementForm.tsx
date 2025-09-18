'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';

interface Client {
  id: string;
  name: string;
}

interface MeasurementFormProps {
  clients: Client[];
  selectedClientId?: string;
  user: {
    id: string;
    name: string;
    role: 'admin' | 'staff';
  };
  onSave: () => void;
  onCancel: () => void;
}

export default function MeasurementForm({ 
  clients, 
  selectedClientId, 
  user, 
  onSave, 
  onCancel 
}: MeasurementFormProps) {
  const [clientId, setClientId] = useState(selectedClientId || '');
  const [value, setValue] = useState('');
  const [measuredAt, setMeasuredAt] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const measurementData = {
        client_id: clientId,
        type: 'weight',
        value: parseFloat(value),
        measured_at: new Date(measuredAt).toISOString(),
        created_by: user.id,
      };

      const { error } = await supabase
        .from('measurements')
        .insert([measurementData]);

      if (error) throw error;
      onSave();
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={onCancel}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          グラフに戻る
        </Button>
        <h1 className="text-3xl font-bold text-gray-900">体重記録</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>新しい体重を記録</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="client">顧客 *</Label>
              <Select value={clientId} onValueChange={setClientId} required>
                <SelectTrigger>
                  <SelectValue placeholder="顧客を選択してください" />
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
              <Label htmlFor="value">体重 (kg) *</Label>
              <Input
                id="value"
                type="number"
                step="0.1"
                min="0"
                max="300"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="例: 55.5"
                required
              />
              <p className="text-sm text-gray-500 mt-1">小数点第1位まで入力可能です</p>
            </div>

            <div>
              <Label htmlFor="measuredAt">測定日 *</Label>
              <Input
                id="measuredAt"
                type="date"
                value={measuredAt}
                onChange={(e) => setMeasuredAt(e.target.value)}
                required
              />
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                {error}
              </div>
            )}

            <div className="flex gap-4 pt-4">
              <Button
                type="submit"
                disabled={loading || !clientId || !value}
                className="flex-1 bg-gradient-to-r from-blue-500 to-pink-500 hover:from-blue-600 hover:to-pink-600"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                記録
              </Button>
              <Button type="button" variant="outline" onClick={onCancel}>
                キャンセル
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}