'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';

interface Client {
  id: string;
  name: string;
}

interface Visit {
  id: string;
  client_id: string;
  visit_date: string;
  service_menu: string;
  notes: string;
}

interface VisitFormProps {
  visit?: Visit | null;
  clients: Client[];
  user: {
    id: string;
    name: string;
    role: 'admin' | 'staff';
  };
  onSave: () => void;
  onCancel: () => void;
}

export default function VisitForm({ visit, clients, user, onSave, onCancel }: VisitFormProps) {
  const [clientId, setClientId] = useState(visit?.client_id || '');
  const [visitDate, setVisitDate] = useState(visit?.visit_date || new Date().toISOString().split('T')[0]);
  const [serviceMenu, setServiceMenu] = useState(visit?.service_menu || '');
  const [notes, setNotes] = useState(visit?.notes || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const serviceMenuOptions = [
    '痩身施術',
    'ボディマッサージ',
    'リンパドレナージュ',
    'キャビテーション',
    'RF・ラジオ波',
    'EMS',
    'ハイフ',
    'セルライト除去',
    '脂肪燃焼マッサージ',
    'その他'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const visitData = {
        client_id: clientId,
        visit_date: visitDate,
        service_menu: serviceMenu,
        notes: notes.trim(),
        created_by: user.id,
      };

      if (visit) {
        const { error } = await supabase
          .from('visits')
          .update(visitData)
          .eq('id', visit.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('visits')
          .insert([visitData]);
        if (error) throw error;
      }

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
          カルテ一覧に戻る
        </Button>
        <h1 className="text-3xl font-bold text-gray-900">
          {visit ? 'カルテ編集' : '新規カルテ作成'}
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>施術記録</CardTitle>
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
              <Label htmlFor="visitDate">来店日 *</Label>
              <Input
                id="visitDate"
                type="date"
                value={visitDate}
                onChange={(e) => setVisitDate(e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="serviceMenu">施術メニュー *</Label>
              <Select value={serviceMenu} onValueChange={setServiceMenu} required>
                <SelectTrigger>
                  <SelectValue placeholder="施術メニューを選択してください" />
                </SelectTrigger>
                <SelectContent>
                  {serviceMenuOptions.map((menu) => (
                    <SelectItem key={menu} value={menu}>
                      {menu}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="notes">施術内容・メモ</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="施術の詳細、顧客の状態、次回の提案など"
                rows={6}
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
                disabled={loading || !clientId || !serviceMenu}
                className="flex-1 bg-gradient-to-r from-blue-500 to-pink-500 hover:from-blue-600 hover:to-pink-600"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                {visit ? '更新' : '登録'}
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