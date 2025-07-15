import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { 
  Mail, 
  MailOpen, 
  Reply, 
  Trash2, 
  Archive, 
  User, 
  Calendar,
  Filter,
  Search,
  Loader2,
  Send,
  Eye
} from 'lucide-react';
import { supabase, ContactMessage } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';

const MessagesManager = () => {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('contact_messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les messages.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const openMessage = async (message: ContactMessage) => {
    setSelectedMessage(message);
    setIsDialogOpen(true);
    
    // Marquer comme lu si pas encore lu
    if (message.status === 'unread') {
      await updateMessageStatus(message.id, 'read');
    }
  };

  const updateMessageStatus = async (messageId: string, status: ContactMessage['status']) => {
    try {
      const { error } = await supabase
        .from('contact_messages')
        .update({ 
          status,
          ...(status === 'replied' && { replied_at: new Date().toISOString() })
        })
        .eq('id', messageId);

      if (error) throw error;
      await loadMessages();
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le statut.",
        variant: "destructive",
      });
    }
  };

  const deleteMessage = async (messageId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce message ?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('contact_messages')
        .delete()
        .eq('id', messageId);

      if (error) throw error;
      
      toast({
        title: "Succès",
        description: "Message supprimé avec succès.",
      });
      
      await loadMessages();
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le message.",
        variant: "destructive",
      });
    }
  };

  const sendReply = async () => {
    if (!selectedMessage || !replyText.trim()) return;

    setSending(true);
    try {
      // Ici vous pourriez intégrer un service d'email comme SendGrid, Resend, etc.
      // Pour cet exemple, on simule l'envoi et on marque comme répondu
      
      await updateMessageStatus(selectedMessage.id, 'replied');
      
      toast({
        title: "Succès",
        description: "Réponse envoyée avec succès.",
      });
      
      setReplyText('');
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Erreur lors de l\'envoi:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer la réponse.",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const getStatusBadge = (status: ContactMessage['status']) => {
    const statusConfig = {
      unread: { label: 'Non lu', variant: 'destructive' as const, icon: Mail },
      read: { label: 'Lu', variant: 'secondary' as const, icon: MailOpen },
      replied: { label: 'Répondu', variant: 'default' as const, icon: Reply },
      archived: { label: 'Archivé', variant: 'outline' as const, icon: Archive }
    };

    const config = statusConfig[status];
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const filteredMessages = messages.filter(message => {
    const matchesFilter = filter === 'all' || message.status === filter;
    const matchesSearch = 
      message.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.message.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Messages de Contact</h1>
          <p className="text-gray-400">
            Gérez les messages reçus via le formulaire de contact
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">
            {messages.filter(m => m.status === 'unread').length} non lus
          </Badge>
        </div>
      </div>

      {/* Filters and Search */}
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Rechercher dans les messages..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-slate-700 border-slate-600 text-white"
                />
              </div>
            </div>
            <div className="flex gap-2">
              {[
                { key: 'all', label: 'Tous' },
                { key: 'unread', label: 'Non lus' },
                { key: 'read', label: 'Lus' },
                { key: 'replied', label: 'Répondus' },
                { key: 'archived', label: 'Archivés' }
              ].map((filterOption) => (
                <Button
                  key={filterOption.key}
                  variant={filter === filterOption.key ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter(filterOption.key)}
                  className={filter === filterOption.key 
                    ? "bg-gradient-to-r from-purple-500 to-pink-500" 
                    : "border-slate-700 text-gray-300 hover:text-white hover:bg-slate-700"
                  }
                >
                  {filterOption.label}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Messages List */}
      <div className="space-y-4">
        {filteredMessages.map((message) => (
          <Card 
            key={message.id} 
            className={`bg-slate-800 border-slate-700 hover:bg-slate-700 transition-colors cursor-pointer ${
              message.status === 'unread' ? 'ring-2 ring-purple-500/30' : ''
            }`}
            onClick={() => openMessage(message)}
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="font-medium text-white">{message.name}</span>
                    </div>
                    <span className="text-gray-400 text-sm">{message.email}</span>
                    {getStatusBadge(message.status)}
                  </div>
                  
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {message.subject}
                  </h3>
                  
                  <p className="text-gray-300 line-clamp-2 mb-3">
                    {message.message}
                  </p>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(message.created_at).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                    {message.replied_at && (
                      <div className="flex items-center gap-1 text-green-400">
                        <Reply className="w-4 h-4" />
                        Répondu le {new Date(message.replied_at).toLocaleDateString('fr-FR')}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      openMessage(message);
                    }}
                    className="border-slate-600 text-gray-300 hover:text-white"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteMessage(message.id);
                    }}
                    className="border-red-500 text-red-400 hover:bg-red-500 hover:text-white"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredMessages.length === 0 && (
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-12 text-center">
            <Mail className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">
              {searchTerm || filter !== 'all' 
                ? 'Aucun message ne correspond à vos critères.'
                : 'Aucun message reçu pour le moment.'
              }
            </p>
          </CardContent>
        </Card>
      )}

      {/* Message Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-700 max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedMessage && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <DialogTitle className="text-white">
                    {selectedMessage.subject}
                  </DialogTitle>
                  {getStatusBadge(selectedMessage.status)}
                </div>
                <DialogDescription>
                  Message de {selectedMessage.name} ({selectedMessage.email})
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6">
                {/* Message Info */}
                <Card className="bg-slate-800 border-slate-700">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-white">{selectedMessage.name}</p>
                          <p className="text-sm text-gray-400">{selectedMessage.email}</p>
                        </div>
                      </div>
                      <div className="text-right text-sm text-gray-400">
                        <p>{new Date(selectedMessage.created_at).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}</p>
                        <p>{new Date(selectedMessage.created_at).toLocaleTimeString('fr-FR', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}</p>
                      </div>
                    </div>
                    
                    <div className="prose prose-invert max-w-none">
                      <p className="text-gray-300 whitespace-pre-wrap">
                        {selectedMessage.message}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Reply Section */}
                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center">
                      <Reply className="w-5 h-5 mr-2" />
                      Répondre
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Textarea
                      placeholder="Tapez votre réponse ici..."
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      rows={6}
                      className="bg-slate-700 border-slate-600 text-white resize-none"
                    />
                    
                    <div className="flex items-center justify-between">
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateMessageStatus(selectedMessage.id, 'archived')}
                          className="border-slate-600 text-gray-300 hover:text-white"
                        >
                          <Archive className="w-4 h-4 mr-2" />
                          Archiver
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteMessage(selectedMessage.id)}
                          className="border-red-500 text-red-400 hover:bg-red-500 hover:text-white"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Supprimer
                        </Button>
                      </div>
                      
                      <Button
                        onClick={sendReply}
                        disabled={!replyText.trim() || sending}
                        className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                      >
                        {sending ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Envoi...
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4 mr-2" />
                            Envoyer
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MessagesManager;