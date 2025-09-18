'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Calendar, User, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import VisitForm from './VisitForm';

interface Visit {
  id: string;
  client_id: string;
  visit_date: string;
  service_menu: string;
  notes: string;
  created_by: string;
  created_at: string;
  client: {
    name: string;
  };
  staff: {
    name: string;
  };
}

interface Client {
  id: string;
  name: string;
}

interface VisitListProps {
  user: {
    id: string;
    name: string;
    role: 'admin' | 'staff';
  };
}

export default function VisitList({ user }: VisitListProps) {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [showForm, setShowForm] = useState(false);
  const [editingVisit, setEditingVisit] = useState<Visit | null>(null);

  useEffect(() => {
    fetchVisits();
    fetchClients();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchVisits = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('visits')
        .select(`
          *,
          client:clients!visits_client_id_fkey(name),
          staff:users!visits_created_by_fkey(name)
        `)
        .order('visit_date', { ascending: false });

      if (error) throw error;
      setVisits(data || []);
    } catch (error) {
      console.error('Error fetching visits:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const handleVisitSaved = () => {
    fetchVisits();
    setShowForm(false);
    setEditingVisit(null);
  };

  const filteredVisits = visits.filter(visit => {
    const matchesSearch = visit.client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         visit.service_menu.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClient = !selectedClient || visit.client_id === selectedClient;
    return matchesSearch && matchesClient;
  });

  if (showForm) {
    return (
      <VisitForm
        visit={editingVisit}
        clients={clients}
        user={user}
        onSave={handleVisitSaved}
        onCancel={() => {
          setShowForm(false);
          setEditingVisit(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">来店カルテ</h1>
          <p className="text-gray-600">施術履歴の管理と記録</p>
        </div>
        <Button
          onClick={() => setShowForm(true)}
          className="bg-gradient-to-r from-blue-500 to-pink-500 hover:from-blue-600 hover:to-pink-600"
        >
          <Plus className="w-4 h-4 mr-2" />
          新規カルテ作成
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="顧客名や施術内容で検索..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedClient || 'all-clients'} onValueChange={(value) => setSelectedClient(value === 'all-clients' ? '' : value)}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="顧客で絞り込み" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-clients">すべての顧客</SelectItem>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              <p className="text-gray-500 mt-2">読み込み中...</p>
            </div>
          ) : filteredVisits.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">
                {searchTerm || selectedClient ? '該当するカルテが見つかりません' : '登録されたカルテはありません'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredVisits.map((visit) => (
                <Card
                  key={visit.id}
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => {
                    setEditingVisit(visit);
                    setShowForm(true);
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-blue-500" />
                        <span className="font-semibold text-lg">
                          {format(new Date(visit.visit_date), 'yyyy年M月d日', { locale: ja })}
                        </span>
                        <Badge variant="outline">{visit.service_menu}</Badge>
                      </div>
                      <div className="text-sm text-gray-600">
                        担当: {visit.staff.name}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 mb-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="font-medium text-gray-900">{visit.client.name}</span>
                    </div>

                    {visit.notes && (
                      <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                        {visit.notes}
                      </p>
                    )}

                    <div className="text-xs text-gray-400 mt-2">
                      記録日時: {format(new Date(visit.created_at), 'yyyy/MM/dd HH:mm', { locale: ja })}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}