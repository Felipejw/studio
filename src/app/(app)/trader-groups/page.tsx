
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageSquare, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '@/components/auth-provider';
import { db, collection, addDoc, getDocs, query, where, orderBy, Timestamp } from '@/lib/firebase';

interface MessageData {
  groupId: 'índice' | 'dólar' | 'forex';
  userId: string;
  userName: string;
  text: string;
  timestamp: Timestamp;
}

interface Message extends Omit<MessageData, 'timestamp'> {
  id: string;
  timestamp: Date; // Convert Firestore Timestamp to Date for display
}

function GroupContent({ groupName, assetType }: { groupName: string, assetType: 'índice' | 'dólar' | 'forex' }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const { user, userProfile, userId } = useAuth();

  const fetchMessages = useCallback(async () => {
    if (!userId) {
      setMessages([]);
      setIsLoadingMessages(false);
      return;
    }
    setIsLoadingMessages(true);
    try {
      const q = query(
        collection(db, "trader_group_messages"),
        where("groupId", "==", assetType),
        orderBy("timestamp", "asc") // Fetch in ascending order to display oldest first
      );
      const querySnapshot = await getDocs(q);
      const fetchedMessages: Message[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data() as MessageData;
        fetchedMessages.push({
          ...data,
          id: doc.id,
          timestamp: data.timestamp.toDate(),
        });
      });
      setMessages(fetchedMessages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      // Consider adding a toast notification for the user here
    }
    setIsLoadingMessages(false);
  }, [assetType, userId]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const handleSendMessage = async () => {
    if (newMessage.trim() === '' || !userId || !userProfile) {
      // Optionally, show a toast if user is not logged in or message is empty
      return;
    }
    setIsSendingMessage(true);
    const messageData: MessageData = {
      groupId: assetType,
      userId: userId,
      userName: userProfile.name || 'Usuário Anônimo',
      text: newMessage,
      timestamp: Timestamp.fromDate(new Date()),
    };

    try {
      await addDoc(collection(db, "trader_group_messages"), messageData);
      setNewMessage('');
      // After sending, refetch messages to include the new one
      // This is not real-time, but updates the list for the sender.
      // Others will see it on their next fetch (e.g., page load or their own send).
      await fetchMessages(); 
    } catch (error) {
      console.error("Error sending message:", error);
      // Consider adding a toast notification for the user here
    }
    setIsSendingMessage(false);
  };

  return (
    <div className="grid md:grid-cols-1 gap-6 md:h-[calc(100vh-300px)]">
      <div className="md:col-span-1 flex flex-col h-full">
        <Card className="flex-grow flex flex-col shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="font-headline flex items-center text-lg">
              <MessageSquare className="mr-2 h-5 w-5 text-primary" /> Discussão: {groupName}
            </CardTitle>
            <CardDescription>Converse com outros traders sobre {assetType}. (As mensagens são salvas no servidor)</CardDescription>
          </CardHeader>
          <CardContent className="flex-grow flex flex-col p-0 overflow-hidden">
            <ScrollArea className="flex-grow p-4">
              {isLoadingMessages ? (
                <div className="flex justify-center items-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="ml-2">Carregando mensagens...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.length > 0 ? messages.map(msg => (
                    <div key={msg.id} className={`flex ${msg.userId === userId ? 'justify-end' : 'justify-start'}`}>
                      <div className={`p-3 rounded-lg max-w-[75%] shadow-sm ${msg.userId === userId ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                        <p className="text-xs font-semibold mb-0.5">{msg.userName} {msg.userId === userId && "(Você)"}</p>
                        <p className="text-sm whitespace-pre-line">{msg.text}</p>
                        <p className="text-xs text-right opacity-70 mt-1">{format(msg.timestamp, 'HH:mm')}</p>
                      </div>
                    </div>
                  )) : (
                    <p className="text-muted-foreground text-center py-8">Nenhuma mensagem neste grupo ainda. Seja o primeiro!</p>
                  )}
                </div>
              )}
            </ScrollArea>
            <div className="p-4 border-t bg-background">
              <div className="flex gap-2">
                <Textarea 
                  placeholder={user ? "Digite sua mensagem..." : "Faça login para enviar mensagens."}
                  className="flex-grow resize-none" 
                  rows={1}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey && user) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  disabled={!user || isSendingMessage || isLoadingMessages}
                />
                <Button 
                  size="default" 
                  onClick={handleSendMessage} 
                  disabled={!user || newMessage.trim() === '' || isSendingMessage || isLoadingMessages}
                >
                  {isSendingMessage ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enviar"}
                </Button>
              </div>
               {!user && <p className="text-xs text-muted-foreground mt-1">Você precisa estar logado para enviar mensagens.</p>}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function TraderGroupsPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-6 text-center md:text-left">
        <h1 className="text-3xl md:text-4xl font-bold font-headline text-foreground">Grupos de Discussão</h1>
        <p className="text-lg text-muted-foreground mt-1">Conecte-se, compartilhe ideias e aprenda com outros traders.</p>
      </div>

      <Tabs defaultValue="indice" className="w-full">
        <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 md:w-auto md:inline-flex mb-6 bg-muted p-1 rounded-lg shadow-sm">
          <TabsTrigger value="índice" className="px-4 py-2.5 text-sm">Mini Índice (WIN)</TabsTrigger>
          <TabsTrigger value="dólar" className="px-4 py-2.5 text-sm">Mini Dólar (WDO)</TabsTrigger>
          <TabsTrigger value="forex" className="px-4 py-2.5 text-sm">Forex & Internacional</TabsTrigger>
        </TabsList>
        <TabsContent value="índice">
          <GroupContent groupName="Análises e Estratégias para WIN" assetType="índice" />
        </TabsContent>
        <TabsContent value="dólar">
          <GroupContent groupName="Movimentações e Operações em WDO" assetType="dólar" />
        </TabsContent>
        <TabsContent value="forex">
          <GroupContent groupName="Pares de Moedas e Mercado Global" assetType="forex" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
