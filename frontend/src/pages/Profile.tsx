import React, { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import Input from "../components/UI/Input";
import Button from "../components/UI/Button";
import { Card, CardHeader, CardContent } from "../components/UI/Card";
import Toast from "../components/UI/Toast";

const Profile: React.FC = () => {
  const { user } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    bio: user?.bio || "",
    phone: user?.phone || "",
    currentPassword: "",
    newPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setForm(f => ({
      ...f,
      name: user?.name || "",
      email: user?.email || "",
      bio: user?.bio || "",
      phone: user?.phone || "",
    }));
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/auth/me", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          bio: form.bio,
          phone: form.phone,
          currentPassword: form.currentPassword || undefined,
          newPassword: form.newPassword || undefined,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Erreur lors de la mise à jour");
      setSuccess("Profil mis à jour avec succès");
      setForm(f => ({ ...f, currentPassword: "", newPassword: "" }));
    } catch (err: any) {
      setError(err.message || "Erreur lors de la mise à jour");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-10">
      <Card>
        <CardHeader>Mon Profil</CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input label="Nom" name="name" value={form.name} onChange={handleChange} required />
              <Input label="Email" name="email" value={form.email} onChange={handleChange} required type="email" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input label="Téléphone" name="phone" value={form.phone} onChange={handleChange} />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rôle</label>
                <input className="w-full px-4 py-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500" value={user?.role} disabled readOnly />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
              <textarea
                name="bio"
                value={form.bio}
                onChange={handleChange}
                rows={3}
                className="block w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-2xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400 dark:focus:ring-sky-500 dark:focus:border-sky-500 transition-all duration-200 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                placeholder="Parlez un peu de vous..."
                maxLength={500}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input label="Mot de passe actuel" name="currentPassword" value={form.currentPassword} onChange={handleChange} type="password" autoComplete="current-password" />
              <Input label="Nouveau mot de passe" name="newPassword" value={form.newPassword} onChange={handleChange} type="password" autoComplete="new-password" />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="submit" isLoading={loading}>
                Enregistrer
              </Button>
            </div>
            {success && <Toast id="success" type="success" title="Succès" message={success} onClose={() => setSuccess(null)} />}
            {error && <Toast id="error" type="error" title="Erreur" message={error} onClose={() => setError(null)} />}
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Profile; 