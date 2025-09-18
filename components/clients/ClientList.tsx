'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Phone, Mail, User, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import ClientForm from './ClientForm';

interface Client {
  id: string;
  name: string;
  contact: string | null;
  notes: string;
  primary_staff_id: string | null;
  created_at: string;
  staff?: {
    name: string;
  };
}

interface ClientListProps {
  user: {
    id: string;
    name: string;
    role: 'admin' | 'staff';
  };
}

export default function ClientList({ user }: ClientListProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  useEffect(() => {
    fetchClients();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchClients = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('clients')
        .select(`
          *,
          staff:users!clients_primary_staff_id_fkey(name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClientSaved = () => {
    fetchClients();
    setShowForm(false);
    setEditingClient(null);
  };

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (client.contact && client.contact.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (showForm) {
    return (
      <ClientForm
        client={editingClient}
        user={user}
        onSave={handleClientSaved}
        onCancel={() => {
          setShowForm(false);
          setEditingClient(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">顧客管理</h1>
          <p className="text-gray-600">顧客情報の管理と検索</p>
        </div>
        <Button
          onClick={() => setShowForm(true)}
          className="bg-gradient-to-r from-blue-500 to-pink-500 hover:from-blue-600 hover:to-pink-600"
        >
          <Plus className="w-4 h-4 mr-2" />
          新規顧客登録
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="顧客名や連絡先で検索..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              <p className="text-gray-500 mt-2">読み込み中...</p>
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="text-center py-8">
              <User className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">
                {searchTerm ? '該当する顧客が見つかりません' : '登録された顧客はいません'}
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredClients.map((client) => (
                <Card
                  key={client.id}
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => {
                    setEditingClient(client);
                    setShowForm(true);
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-semibold text-gray-900 text-lg">
                        {client.name}
                      </h3>
                      {client.staff && (
                        <Badge variant="secondary" className="text-xs">
                          担当: {client.staff.name}
                        </Badge>
                      )}
                    </div>
                    
                    {client.contact && (
                      <div className="flex items-center text-sm text-gray-600 mb-2">
                        {client.contact.includes('@') ? (
                          <Mail className="w-4 h-4 mr-2" />
                        ) : (
                          <Phone className="w-4 h-4 mr-2" />
                        )}
                        {client.contact}
                      </div>
                    )}

                    <div className="flex items-center text-xs text-gray-500 mb-2">
                      <Calendar className="w-3 h-3 mr-1" />
                      登録: {format(new Date(client.created_at), 'yyyy/MM/dd', { locale: ja })}
                    </div>

                    {client.notes && (
                      <p className="text-sm text-gray-600 line-clamp-2 mt-2">
                        {client.notes}
                      </p>
                    )}
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