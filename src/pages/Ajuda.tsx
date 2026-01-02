import {
  Book,
  ExternalLink,
  MessageCircle,
  Mail,
  FileText,
  Video,
  HelpCircle,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const resources = [
  {
    title: 'Documentação',
    description: 'Guias completos sobre todas as funcionalidades',
    icon: Book,
    href: '#',
  },
  {
    title: 'Tutoriais em Vídeo',
    description: 'Aprenda visualmente com nossos tutoriais',
    icon: Video,
    href: '#',
  },
  {
    title: 'Central de Ajuda',
    description: 'Encontre respostas para dúvidas frequentes',
    icon: HelpCircle,
    href: '#',
  },
  {
    title: 'Notas de Atualização',
    description: 'Veja as últimas novidades e melhorias',
    icon: FileText,
    href: '#',
  },
];

const faqs = [
  {
    question: 'Como conectar minha conta do Facebook?',
    answer:
      'Acesse a página de Integrações, clique em "Conectar com Facebook" e siga as instruções para autorizar o acesso.',
  },
  {
    question: 'Como adicionar um novo cliente?',
    answer:
      'Na página de Clientes, clique em "Novo Cliente" e preencha o formulário com os dados do cliente.',
  },
  {
    question: 'Como funcionam os alertas de orçamento?',
    answer:
      'Os alertas são disparados automaticamente quando uma conta atinge o percentual configurado do orçamento. Você pode ajustar os limites nas Configurações.',
  },
  {
    question: 'Posso exportar os dados das campanhas?',
    answer:
      'Sim! Em cada tabela você encontra opções de exportação para CSV ou PDF (em breve).',
  },
];

export default function Ajuda() {
  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Ajuda & Documentação</h1>
          <p className="text-muted-foreground">
            Encontre respostas e aprenda a usar o sistema
          </p>
        </div>

        {/* Resources Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {resources.map((resource) => (
            <Card
              key={resource.title}
              className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50"
            >
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="rounded-lg bg-primary/10 p-2.5">
                    <resource.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium mb-1">{resource.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {resource.description}
                    </p>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* FAQ Section */}
        <Card>
          <CardHeader>
            <CardTitle>Perguntas Frequentes</CardTitle>
            <CardDescription>
              Respostas rápidas para as dúvidas mais comuns
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {faqs.map((faq, index) => (
                <div key={index} className="border-b last:border-0 pb-4 last:pb-0">
                  <h4 className="font-medium mb-2">{faq.question}</h4>
                  <p className="text-sm text-muted-foreground">{faq.answer}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Contact Section */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Chat de Suporte
              </CardTitle>
              <CardDescription>
                Converse com nossa equipe em tempo real
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">Iniciar Chat</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Suporte por Email
              </CardTitle>
              <CardDescription>
                Envie sua dúvida e responderemos em até 24h
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                suporte@trafegoads.com.br
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
