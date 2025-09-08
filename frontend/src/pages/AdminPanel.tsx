"use client"

import React, { useEffect, useState } from "react";
import apiService from "../services/api";
import Button from "../components/UI/Button";
import Input from "../components/UI/Input";
import Modal from "../components/UI/Modal";
import Toast from "../components/UI/Toast";

const roles = ["employee", "manager", "admin"];

// Onglets disponibles
const TABS = ["Utilisateurs", "Projets", "Statistiques"];

const AdminPanel: React.FC = () => {
  const [tab, setTab] = useState("Utilisateurs");

  // --- Utilisateurs ---
  const [users, setUsers] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState<any | null>(null);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "employee" });
  const [formError, setFormError] = useState<string | null>(null);

  // --- Projets ---
  const [projects, setProjects] = useState<any[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [errorProjects, setErrorProjects] = useState<string | null>(null);

  // --- Statistiques ---
  const [stats, setStats] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [errorStats, setErrorStats] = useState<string | null>(null);

  // --- Utilisateurs ---
  const fetchUsers = async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.append("page", String(page));
      params.append("limit", String(pagination.limit));
      if (search) params.append("search", search);
      if (roleFilter) params.append("role", roleFilter);
      const res = await apiService.request<any>(`/users?${params.toString()}`);
      setUsers(res.data.users);
      setPagination(res.data.pagination);
    } catch (err: any) {
      setError(err.message || "Erreur lors du chargement des utilisateurs");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { if (tab === "Utilisateurs") fetchUsers(1); }, [search, roleFilter, tab]);
  const handlePageChange = (page: number) => { fetchUsers(page); };
  const openCreateModal = () => { setEditUser(null); setForm({ name: "", email: "", password: "", role: "employee" }); setShowModal(true); setFormError(null); };
  const openEditModal = (user: any) => { setEditUser(user); setForm({ name: user.name, email: user.email, password: "", role: user.role }); setShowModal(true); setFormError(null); };
  const closeModal = () => { setShowModal(false); setEditUser(null); setFormError(null); };
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => { setForm({ ...form, [e.target.name]: e.target.value }); setFormError(null); };
  const handleSubmit = async (e: React.FormEvent) => { e.preventDefault(); setFormError(null); try { if (editUser) { await apiService.request<any>(`/users/${editUser._id}`, { method: "PUT", body: JSON.stringify({ name: form.name, email: form.email, role: form.role }), headers: { "Content-Type": "application/json" }, }); setSuccess("Utilisateur modifié avec succès"); } else { await apiService.request<any>(`/users`, { method: "POST", body: JSON.stringify(form), headers: { "Content-Type": "application/json" }, }); setSuccess("Utilisateur créé avec succès"); } closeModal(); fetchUsers(pagination.page); } catch (err: any) { setFormError(err.response?.data?.message || err.message || "Erreur lors de l'enregistrement"); } };
  const handleDelete = async (user: any) => { if (!window.confirm("Supprimer cet utilisateur ?")) return; try { await apiService.request<any>(`/users/${user._id}`, { method: "DELETE" }); setSuccess("Utilisateur supprimé"); fetchUsers(pagination.page); } catch (err: any) { setError(err.response?.data?.message || err.message || "Erreur lors de la suppression"); } };
  const handleToggleStatus = async (user: any) => { try { await apiService.request<any>(`/users/${user._id}/toggle-status`, { method: "PATCH" }); setSuccess("Statut modifié"); fetchUsers(pagination.page); } catch (err: any) { setError(err.response?.data?.message || err.message || "Erreur lors du changement de statut"); } };

  // --- Projets ---
  const fetchProjects = async () => {
    setLoadingProjects(true);
    setErrorProjects(null);
    try {
      const res = await apiService.request<any>(`/projects/all`);
      setProjects(res.data.data || []);
    } catch (err: any) {
      setErrorProjects(err.message || "Erreur lors du chargement des projets");
    } finally {
      setLoadingProjects(false);
    }
  };
  useEffect(() => { if (tab === "Projets") fetchProjects(); }, [tab]);

  // --- Statistiques ---
  const fetchStats = async () => {
    setLoadingStats(true);
    setErrorStats(null);
    try {
      const [dashboard, users] = await Promise.all([
        apiService.request<any>(`/stats/dashboard`),
        apiService.request<any>(`/users?limit=1`),
      ]);
      setStats({
        ...dashboard.data,
        totalUsers: users.data.pagination.total,
      });
    } catch (err: any) {
      setErrorStats(err.message || "Erreur lors du chargement des statistiques");
    } finally {
      setLoadingStats(false);
    }
  };
  useEffect(() => { if (tab === "Statistiques") fetchStats(); }, [tab]);

  return (
    <div className="p-6">
      <div className="flex gap-2 mb-6">
        {TABS.map(t => (
          <Button key={t} variant={tab === t ? "primary" : "secondary"} onClick={() => setTab(t)}>{t}</Button>
        ))}
      </div>
      {tab === "Utilisateurs" && (
        <>
          <h2 className="text-2xl font-bold mb-4">Gestion des utilisateurs</h2>
          <div className="flex gap-2 mb-4">
            <Input placeholder="Recherche nom/email..." value={search} onChange={e => setSearch(e.target.value)} />
            <select className="border rounded px-2 py-1" value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
              <option value="">Tous les rôles</option>
              {roles.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <Button onClick={openCreateModal}>Créer utilisateur</Button>
              </div>
          {error && <Toast type="error" message={error} />}
          {success && <Toast type="success" message={success} onClose={() => setSuccess(null)} />}
          <div className="overflow-x-auto">
            <table className="min-w-full border bg-white dark:bg-gray-800">
              <thead>
                <tr>
                  <th className="px-4 py-2">Nom</th>
                  <th className="px-4 py-2">Email</th>
                  <th className="px-4 py-2">Rôle</th>
                  <th className="px-4 py-2">Statut</th>
                  <th className="px-4 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user._id} className="border-t">
                    <td className="px-4 py-2">{user.name}</td>
                    <td className="px-4 py-2">{user.email}</td>
                    <td className="px-4 py-2">{user.role}</td>
                    <td className="px-4 py-2">{user.isActive ? "Actif" : "Inactif"}</td>
                    <td className="px-4 py-2 flex gap-2">
                      <Button size="sm" onClick={() => openEditModal(user)}>Éditer</Button>
                      <Button size="sm" variant={user.isActive ? "secondary" : "primary"} onClick={() => handleToggleStatus(user)}>{user.isActive ? "Désactiver" : "Activer"}</Button>
                      <Button size="sm" variant="danger" onClick={() => handleDelete(user)}>Supprimer</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex gap-2 mt-4">
            {Array.from({ length: pagination.pages }, (_, i) => (
              <Button key={i} size="sm" variant={pagination.page === i + 1 ? "primary" : "secondary"} onClick={() => handlePageChange(i + 1)}>{i + 1}</Button>
            ))}
          </div>
          <Modal isOpen={showModal} onClose={closeModal} title={editUser ? "Éditer utilisateur" : "Créer utilisateur"}>
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <Input name="name" placeholder="Nom" value={form.name} onChange={handleFormChange} required />
              <Input name="email" placeholder="Email" value={form.email} onChange={handleFormChange} required type="email" />
              {!editUser && <Input name="password" placeholder="Mot de passe" value={form.password} onChange={handleFormChange} required type="password" />}
              <select name="role" value={form.role} onChange={handleFormChange} className="border rounded px-2 py-1">
                {roles.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              {formError && <Toast type="error" message={formError} />}
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="secondary" onClick={closeModal}>Annuler</Button>
                <Button type="submit">{editUser ? "Enregistrer" : "Créer"}</Button>
          </div>
        </form>
      </Modal>
        </>
      )}
      {tab === "Projets" && (
        <>
          <h2 className="text-2xl font-bold mb-4">Tous les projets</h2>
          {loadingProjects && <div>Chargement...</div>}
          {errorProjects && <Toast type="error" message={errorProjects} />}
          <div className="overflow-x-auto">
            <table className="min-w-full border bg-white dark:bg-gray-800">
              <thead>
                <tr>
                  <th className="px-4 py-2">Nom</th>
                  <th className="px-4 py-2">Manager</th>
                  <th className="px-4 py-2">Membres</th>
                  <th className="px-4 py-2">Tâches</th>
                </tr>
              </thead>
              <tbody>
                {projects.map(project => (
                  <tr key={project._id} className="border-t">
                    <td className="px-4 py-2 font-semibold">{project.name}</td>
                    <td className="px-4 py-2">{project.owner?.name || "-"} <span className="text-xs text-gray-500">({project.owner?.email})</span></td>
                    <td className="px-4 py-2">{project.members?.map((m: any) => m.name).join(", ")}</td>
                    <td className="px-4 py-2">{project.tasks?.length ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
      {tab === "Statistiques" && (
        <>
          <h2 className="text-2xl font-bold mb-4">Statistiques avancées</h2>
          {loadingStats && <div>Chargement...</div>}
          {errorStats && <Toast type="error" message={errorStats} />}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="bg-white dark:bg-gray-800 rounded shadow p-6">
                <div className="text-gray-500">Nombre total de projets</div>
                <div className="text-3xl font-bold">{projects.length}</div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded shadow p-6">
                <div className="text-gray-500">Nombre total de tâches</div>
                <div className="text-3xl font-bold">{stats.taskStats?.total ?? '-'}</div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded shadow p-6">
                <div className="text-gray-500">Nombre total d'utilisateurs</div>
                <div className="text-3xl font-bold">{stats.totalUsers ?? '-'}</div>
              </div>
            </div>
          )}
          {stats && (
            <div className="bg-white dark:bg-gray-800 rounded shadow p-6">
              <div className="font-semibold mb-2">Répartition des tâches</div>
              <div className="flex gap-6">
                <div>À faire : <span className="font-bold">{stats.taskStats?.todo ?? '-'}</span></div>
                <div>En cours : <span className="font-bold">{stats.taskStats?.inProgress ?? '-'}</span></div>
                <div>Terminées : <span className="font-bold">{stats.taskStats?.completed ?? '-'}</span></div>
                <div>En retard : <span className="font-bold">{stats.taskStats?.overdue ?? '-'}</span></div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminPanel;
