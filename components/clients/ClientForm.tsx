'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';

interface Staff {
  id: string;
  name: string;
}

interface Client {
  id: string;
  name: string;
  contact: string | null;
  notes: string;
  primary_staff_id: string | null;
}

interface ClientFormProps {
  client?: Client | null;
  user: {
    id: string;
    name: string;
    role: 'admin' | 'staff';
  };
  onSave: () => void;
  onCancel: () => void;
}

export default function ClientForm({ client, user, onSave, onCancel }: ClientFormProps) {
  const [name, setName] = useState(client?.name || '');
  const [contact, setContact] = useState(client?.contact || '');
  const [notes, setNotes] = useState(client?.notes || '');
  const [primaryStaffId, setPrimaryStaffId] = useState(client?.primary_staff_id || user?.id);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchStaff();
    }
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchStaff = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, name')
        .eq('active', true)
        .order('name');

      if (error) throw error;
      setStaff(data || []);
    } catch (error) {
      console.error('Error fetching staff:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const clientData = {
        name: name.trim(),
        contact: contact.trim() || null,
        notes: notes.trim(),
        primary_staff_id: primaryStaffId,
      };

      if (client) {
        const { error } = await supabase
          .from('clients')
          .update(clientData)
          .eq('id', client.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('clients')
          .insert([clientData]);
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
          顧客リストに戻る
        </Button>
        <h1 className="text-3xl font-bold text-gray-900">
          {client ? '顧客情報編集' : '新規顧客登録'}
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>顧客情報</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="name">お名前 *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="山田 花子"
                required
              />
            </div>

            <div>
              <Label htmlFor="contact">連絡先</Label>
              <Input
                id="contact"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="090-1234-5678 または email@example.com"
              />
            </div>

            {user?.role === 'admin' && (
              <div>
                <Label htmlFor="staff">担当スタッフ</Label>
                <Select value={primaryStaffId || ''} onValueChange={setPrimaryStaffId}>
                  <SelectTrigger>
                    <SelectValue placeholder="担当スタッフを選択" />
                  </SelectTrigger>
                  <SelectContent>
                    {staff.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label htmlFor="notes">メモ・特記事項</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="アレルギー、希望施術、その他特記事項など"
                rows={4}
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
                disabled={loading || !name.trim()}
                className="flex-1 bg-gradient-to-r from-blue-500 to-pink-500 hover:from-blue-600 hover:to-pink-600"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                {client ? '更新' : '登録'}
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