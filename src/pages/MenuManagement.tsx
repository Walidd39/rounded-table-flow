import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Edit } from "lucide-react";
import { toast } from "sonner";

interface MenuItem {
  id: string;
  nom_plat: string;
  prix: number;
  categorie: string;
  disponible: boolean;
}

export default function MenuManagement() {
  const { user } = useAuth();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  
  // Form state
  const [nomPlat, setNomPlat] = useState("");
  const [prix, setPrix] = useState("");
  const [categorie, setCategorie] = useState("plat");

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const fetchMenuItems = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('menus_prix')
        .select('*')
        .eq('restaurant_id', user.id)
        .order('categorie, nom_plat');

      if (error) throw error;
      setMenuItems(data || []);
    } catch (error: any) {
      toast.error("Erreur lors du chargement du menu");
      console.error('Error fetching menu items:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenuItems();
  }, [user.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nomPlat.trim() || !prix) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }

    try {
      const itemData = {
        restaurant_id: user.id,
        nom_plat: nomPlat.trim(),
        prix: parseFloat(prix),
        categorie,
        disponible: true
      };

      if (editingItem) {
        // Update existing item
        const { error } = await supabase
          .from('menus_prix')
          .update(itemData)
          .eq('id', editingItem.id);

        if (error) throw error;
        toast.success("Plat mis à jour avec succès");
      } else {
        // Create new item
        const { error } = await supabase
          .from('menus_prix')
          .insert([itemData]);

        if (error) throw error;
        toast.success("Plat ajouté avec succès");
      }

      // Reset form
      setNomPlat("");
      setPrix("");
      setCategorie("plat");
      setEditingItem(null);
      fetchMenuItems();
      
    } catch (error: any) {
      toast.error("Erreur lors de la sauvegarde");
      console.error('Error saving menu item:', error);
    }
  };

  const handleEdit = (item: MenuItem) => {
    setEditingItem(item);
    setNomPlat(item.nom_plat);
    setPrix(item.prix.toString());
    setCategorie(item.categorie);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce plat ?")) return;

    try {
      const { error } = await supabase
        .from('menus_prix')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success("Plat supprimé avec succès");
      fetchMenuItems();
    } catch (error: any) {
      toast.error("Erreur lors de la suppression");
      console.error('Error deleting menu item:', error);
    }
  };

  const toggleAvailability = async (item: MenuItem) => {
    try {
      const { error } = await supabase
        .from('menus_prix')
        .update({ disponible: !item.disponible })
        .eq('id', item.id);

      if (error) throw error;
      toast.success(`Plat ${!item.disponible ? 'activé' : 'désactivé'}`);
      fetchMenuItems();
    } catch (error: any) {
      toast.error("Erreur lors de la mise à jour");
      console.error('Error updating availability:', error);
    }
  };

  const categorieLabels = {
    entree: "Entrées",
    plat: "Plats",
    dessert: "Desserts", 
    boisson: "Boissons"
  };

  const groupedItems = menuItems.reduce((acc, item) => {
    if (!acc[item.categorie]) {
      acc[item.categorie] = [];
    }
    acc[item.categorie].push(item);
    return acc;
  }, {} as Record<string, MenuItem[]>);

  return (
    <div className="container mx-auto py-6 space-y-6">
      <h1 className="text-3xl font-bold">Gestion du Menu</h1>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Add/Edit Form */}
        <Card>
          <CardHeader>
            <CardTitle>
              {editingItem ? 'Modifier le plat' : 'Ajouter un plat'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="nom_plat">Nom du plat</Label>
                <Input
                  id="nom_plat"
                  value={nomPlat}
                  onChange={(e) => setNomPlat(e.target.value)}
                  placeholder="Ex: Pizza Margherita"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="prix">Prix (€)</Label>
                <Input
                  id="prix"
                  type="number"
                  step="0.01"
                  min="0"
                  value={prix}
                  onChange={(e) => setPrix(e.target.value)}
                  placeholder="12.50"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="categorie">Catégorie</Label>
                <Select value={categorie} onValueChange={setCategorie}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="entree">Entrées</SelectItem>
                    <SelectItem value="plat">Plats</SelectItem>
                    <SelectItem value="dessert">Desserts</SelectItem>
                    <SelectItem value="boisson">Boissons</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  <Plus className="h-4 w-4 mr-1" />
                  {editingItem ? 'Modifier' : 'Ajouter'}
                </Button>
                {editingItem && (
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => {
                      setEditingItem(null);
                      setNomPlat("");
                      setPrix("");
                      setCategorie("plat");
                    }}
                  >
                    Annuler
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Menu Items List */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Menu actuel</span>
                <Badge variant="secondary">{menuItems.length} plats</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Chargement du menu...</div>
              ) : Object.keys(groupedItems).length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Aucun plat dans le menu. Commencez par ajouter des plats.
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(groupedItems).map(([cat, items]) => (
                    <div key={cat}>
                      <h3 className="text-lg font-semibold mb-3">
                        {categorieLabels[cat as keyof typeof categorieLabels]}
                      </h3>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Nom du plat</TableHead>
                            <TableHead>Prix</TableHead>
                            <TableHead>Statut</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {items.map((item) => (
                            <TableRow key={item.id}>
                              <TableCell>{item.nom_plat}</TableCell>
                              <TableCell>{item.prix.toFixed(2)}€</TableCell>
                              <TableCell>
                                <Badge 
                                  variant={item.disponible ? "default" : "secondary"}
                                  className="cursor-pointer"
                                  onClick={() => toggleAvailability(item)}
                                >
                                  {item.disponible ? "Disponible" : "Indisponible"}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-2">
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => handleEdit(item)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="destructive"
                                    onClick={() => handleDelete(item.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}