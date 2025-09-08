import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import apiService from "../services/api";
import { Card, CardContent, CardHeader } from "../components/UI/Card";
import Button from "../components/UI/Button";
import Input from "../components/UI/Input";
import Toast from "../components/UI/Toast";
import { useAuth } from "../contexts/AuthContext";

const TaskDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [task, setTask] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Charger la tâche et ses commentaires
  useEffect(() => {
    const fetchTask = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await apiService.request<any>(`/tasks/${id}`);
        setTask(res.data.task);
        setComments(res.data.task.comments || []);
      } catch (err: any) {
        setError(err.message || "Erreur lors du chargement de la tâche");
      } finally {
        setLoading(false);
      }
    };
    fetchTask();
  }, [id]);

  // Ajouter un commentaire
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!comment.trim()) {
      setError("Le commentaire ne peut pas être vide");
      return;
    }
    try {
      const res = await apiService.request<any>(
        `/tasks/${id}/comments`,
        {
          method: "POST",
          body: JSON.stringify({ content: comment }),
          headers: { "Content-Type": "application/json" },
        }
      );
      setComments(res.data.task.comments || []);
      setComment("");
      setSuccess("Commentaire ajouté avec succès");
    } catch (err: any) {
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else if (err.message) {
        setError(err.message);
      } else {
        setError("Erreur lors de l'ajout du commentaire");
      }
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Chargement...</div>;
  }
  if (error) {
    return <div className="p-8 text-center text-red-500">{error}</div>;
  }
  if (!task) {
    return <div className="p-8 text-center text-gray-500">Tâche introuvable</div>;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Détail de la tâche</h1>
        <Button variant="ghost" onClick={() => navigate(-1)} className="text-gray-500 hover:text-gray-700">
          Retour
        </Button>
      </div>
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-gray-900">{task.title}</h2>
        </CardHeader>
        <CardContent>
          <p className="mb-2 text-gray-700">{task.description}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
            <div><b>Statut :</b> {task.status}</div>
            <div><b>Priorité :</b> {task.priority}</div>
            <div><b>Date limite :</b> {new Date(task.dueDate).toLocaleDateString("fr-FR")}</div>
            <div><b>Assigné à :</b> {task.assignedTo?.name || task.assignedTo?.email || task.assignedTo}</div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <h3 className="text-md font-semibold text-gray-900">Commentaires</h3>
        </CardHeader>
        <CardContent>
          {comments.length === 0 ? (
            <div className="text-gray-500">Aucun commentaire pour cette tâche.</div>
          ) : (
            <ul className="space-y-4 mb-4">
              {comments.map((c, idx) => (
                <li key={idx} className="border-b pb-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-gray-800">{c.user?.name || c.user?.email || "Utilisateur"}</span>
                    <span className="text-xs text-gray-400">{new Date(c.createdAt).toLocaleString("fr-FR")}</span>
                  </div>
                  <div className="text-gray-700 mt-1">{c.content}</div>
                </li>
              ))}
            </ul>
          )}
          <form onSubmit={handleAddComment} className="flex flex-col space-y-2">
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Ajouter un commentaire..."
              rows={2}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <div className="flex items-center justify-end space-x-2">
              <Button type="submit" className="px-4">Commenter</Button>
            </div>
          </form>
          {success && <Toast type="success" message={success} onClose={() => setSuccess(null)} />}
          {error && <Toast type="error" message={error} onClose={() => setError(null)} />}
        </CardContent>
      </Card>
    </div>
  );
};

export default TaskDetails; 