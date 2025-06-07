
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageSquare, Users, LogIn, LogOut } from 'lucide-react';
import { format } from 'date-fns';

interface Message {
  id: string;
  user: string;
  text: string;
  time: string;
  type: 'índice' | 'dólar' | 'forex';
}

const initialMessages: Message[] = [
  { id: '1', user: 'Trader Z', text: 'Bom dia, pessoal! Alguma análise pro mini índice hoje?', time: '09:02', type: 'índice' },
  { id: '3', user: 'Analista X', text: 'O dólar parece estar buscando liquidez acima dos 5.40. Cautela!', time: '09:01', type: 'dólar' },
  { id: '4', user: 'Forex King', text: 'EUR/USD consolidado, aguardando notícias da Europa.', time: '08:55', type: 'forex' },
  { id: '5', user: 'Novato Y', text: 'Alguém pode me explicar o ajuste do dólar de ontem?', time: '09:10', type: 'dólar' },
  { id: '6', user: 'Especialista FX', text: 'Atenção ao payroll americano, pode impactar forte o EUR/USD!', time: '09:15', type: 'forex' },
];

function GroupContent({ groupName, assetType }: { groupName: string, assetType: 'índice' | 'dólar' | 'forex' }) {
  const [messages, setMessages] = useState<Message[]>(() => 
    initialMessages.filter(msg => msg.type === assetType)
  );
  const [newMessage, setNewMessage] = useState('');

  const handleSendMessage = () => {
    if (newMessage.trim() === '') return;
    const now = new Date();
    const newMessageObj: Message = {
      id: String(Date.now()), 
      user: 'Você',
      text: newMessage,
      time: format(now, 'HH:mm'),
      type: assetType,
    };
    setMessages(prevMessages => [...prevMessages, newMessageObj]);
    setNewMessage('');
  };

  return (
    <div className="grid md:grid-cols-1 gap-6 md:h-[calc(100vh-300px)]">
      <div className="md:col-span-1 flex flex-col h-full">
        <Card className="flex-grow flex flex-col shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="font-headline flex items-center text-lg">
              <MessageSquare className="mr-2 h-5 w-5 text-primary" /> Discussão: {groupName}
            </CardTitle>
            <CardDescription>Converse com outros traders sobre {assetType}. (As mensagens são apenas locais)</CardDescription>
          </CardHeader>
          <CardContent className="flex-grow flex flex-col p-0 overflow-hidden">
            <ScrollArea className="flex-grow p-4">
              <div className="space-y-4">
                {messages.length > 0 ? messages.map(msg => (
                  <div key={msg.id} className={`flex ${msg.user === 'Você' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`p-3 rounded-lg max-w-[75%] shadow-sm ${msg.user === 'Você' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                      <p className="text-xs font-semibold mb-0.5">{msg.user}</p>
                      <p className="text-sm whitespace-pre-line">{msg.text}</p>
                      <p className="text-xs text-right opacity-70 mt-1">{msg.time}</p>
                    </div>
                  </div>
                )) : (
                  <p className="text-muted-foreground text-center py-8">Nenhuma mensagem neste grupo ainda. Seja o primeiro!</p>
                )}
              </div>
            </ScrollArea>
            <div className="p-4 border-t bg-background">
              <div className="flex gap-2">
                <Textarea 
                  placeholder="Digite sua mensagem..." 
                  className="flex-grow resize-none" 
                  rows={1}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                />
                <Button size="default" onClick={handleSendMessage}>Enviar</Button>
              </div>
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
          <TabsTrigger value="indice" className="px-4 py-2.5 text-sm">Mini Índice (WIN)</TabsTrigger>
          <TabsTrigger value="dolar" className="px-4 py-2.5 text-sm">Mini Dólar (WDO)</TabsTrigger>
          <TabsTrigger value="forex" className="px-4 py-2.5 text-sm">Forex & Internacional</TabsTrigger>
        </TabsList>
        <TabsContent value="indice">
          <GroupContent groupName="Análises e Estratégias para WIN" assetType="índice" />
        </TabsContent>
        <TabsContent value="dolar">
          <GroupContent groupName="Movimentações e Operações em WDO" assetType="dólar" />
        </TabsContent>
        <TabsContent value="forex">
          <GroupContent groupName="Pares de Moedas e Mercado Global" assetType="forex" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
