import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  HelpCircle, 
  MessageCircle, 
  Phone, 
  Mail, 
  Book, 
  Video,
  Search,
  ChevronRight,
  ExternalLink
} from "lucide-react";
import { useState } from "react";

const faqItems = [
  {
    question: "Comment puis-je créer un agent vocal ?",
    answer: "Pour créer un agent vocal, allez dans la section 'Dashboard Restaurant' et cliquez sur 'Créer un Agent'. Remplissez les informations de votre restaurant et définissez les paramètres de l'agent selon vos besoins.",
    category: "Agents"
  },
  {
    question: "Combien coûte l'utilisation d'un agent vocal ?",
    answer: "Le coût dépend du nombre de minutes utilisées. Consultez notre page de tarification pour connaître les détails des forfaits disponibles.",
    category: "Tarification"
  },
  {
    question: "Comment gérer mes réservations ?",
    answer: "Vous pouvez voir toutes vos réservations dans la section 'Réservations'. Vous pouvez également modifier le statut des réservations (confirmée, arrivée, annulée) directement depuis cette interface.",
    category: "Réservations"
  },
  {
    question: "Comment suivre mes commandes ?",
    answer: "Accédez à la section 'Commandes' pour voir toutes les commandes reçues. Vous pouvez mettre à jour le statut des commandes (reçue, en préparation, prête, livrée) en temps réel.",
    category: "Commandes"
  },
  {
    question: "Comment recharger mes minutes ?",
    answer: "Allez dans 'Recharge Minutes' dans le menu latéral. Choisissez votre forfait et procédez au paiement sécurisé via Stripe.",
    category: "Minutes"
  }
];

const contactMethods = [
  {
    title: "Support par email",
    description: "Contactez notre équipe support par email",
    icon: Mail,
    contact: "support@votre-domaine.com",
    available: "24h/24, 7j/7"
  },
  {
    title: "Support téléphonique",
    description: "Appelez-nous directement pour une assistance immédiate",
    icon: Phone,
    contact: "+33 1 XX XX XX XX",
    available: "Lun-Ven 9h-18h"
  },
  {
    title: "Chat en direct",
    description: "Discutez en temps réel avec notre équipe",
    icon: MessageCircle,
    contact: "Disponible sur le site",
    available: "Lun-Ven 9h-18h"
  }
];

export default function Help() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Tous");

  const categories = ["Tous", ...Array.from(new Set(faqItems.map(item => item.category)))];

  const filteredFAQ = faqItems.filter(item => {
    const matchesSearch = item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "Tous" || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <AppLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Centre d'aide</h1>
          <p className="text-muted-foreground">
            Trouvez des réponses à vos questions et contactez notre support
          </p>
        </div>

        {/* Actions rapides */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6 text-center">
              <Book className="h-8 w-8 mx-auto mb-3 text-primary" />
              <h3 className="font-semibold mb-2">Guide d'utilisation</h3>
              <p className="text-sm text-muted-foreground">
                Documentation complète de la plateforme
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6 text-center">
              <Video className="h-8 w-8 mx-auto mb-3 text-primary" />
              <h3 className="font-semibold mb-2">Tutoriels vidéo</h3>
              <p className="text-sm text-muted-foreground">
                Apprenez avec nos vidéos explicatives
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6 text-center">
              <MessageCircle className="h-8 w-8 mx-auto mb-3 text-primary" />
              <h3 className="font-semibold mb-2">Support direct</h3>
              <p className="text-sm text-muted-foreground">
                Contactez notre équipe d'assistance
              </p>
            </CardContent>
          </Card>
        </div>

        {/* FAQ */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5" />
              Questions fréquemment posées
            </CardTitle>
            
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher dans la FAQ..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <Badge
                    key={category}
                    variant={selectedCategory === category ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => setSelectedCategory(category)}
                  >
                    {category}
                  </Badge>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {filteredFAQ.map((item, index) => (
              <Card key={index} className="border-l-4 border-l-primary/20">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <h4 className="font-semibold text-sm">{item.question}</h4>
                      <p className="text-sm text-muted-foreground">{item.answer}</p>
                      <Badge variant="outline" className="text-xs">
                        {item.category}
                      </Badge>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {filteredFAQ.length === 0 && (
              <div className="text-center p-8">
                <HelpCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Aucune question ne correspond à votre recherche.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Contact */}
        <Card>
          <CardHeader>
            <CardTitle>Nous contacter</CardTitle>
            <p className="text-sm text-muted-foreground">
              Notre équipe support est là pour vous aider
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-3 gap-4">
              {contactMethods.map((method, index) => (
                <Card key={index} className="border-dashed">
                  <CardContent className="p-4 text-center">
                    <method.icon className="h-6 w-6 mx-auto mb-2 text-primary" />
                    <h4 className="font-semibold text-sm mb-1">{method.title}</h4>
                    <p className="text-xs text-muted-foreground mb-2">{method.description}</p>
                    <p className="text-sm font-medium">{method.contact}</p>
                    <p className="text-xs text-muted-foreground">{method.available}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Formulaire de contact */}
            <div className="border-t pt-6">
              <h4 className="font-semibold mb-4">Envoyer un message</h4>
              <div className="grid md:grid-cols-2 gap-4">
                <Input placeholder="Votre nom" />
                <Input placeholder="Votre email" />
              </div>
              <Input placeholder="Sujet" className="mt-4" />
              <Textarea 
                placeholder="Décrivez votre problème ou votre question..." 
                className="mt-4 min-h-[100px]"
              />
              <Button className="mt-4">
                <Mail className="h-4 w-4 mr-2" />
                Envoyer le message
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}