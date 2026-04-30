import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import TaskModal from '../components/TaskModal';
import toast from 'react-hot-toast';

export default function ProjectDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [showAddMember, setShowAddMember] = useState(false);
  const [memberEmail, setMemberEmail] = useState('');
  const [memberRole, setMemberRole] = useState('member');

  const myRole = project?.members?.find(m => m.user._id === user?._id)?.role;
  const isAdmin = myRole === 'admin';

  const fetchData = async () => {
    try {
      const [pRes, tRes] = await Promise.all([
        api.get(`/projects/${id}`),
        api.get(`/tasks/project/${id}`),
      ]);
      setProject(pRes.data.data.project);
      setTasks(tRes.data.data.tasks);
    } catch { toast.error('Failed to load project'); navigate('/projects'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [id]);

  const handleCreateTask = async (formData) => {
    await api.post('/tasks', { ...formData, project: id });
    toast.success('Task created!');
    fetchData();
  };

  const handleUpdateTask = async (formData) => {
    await api.put(`/tasks/${editingTask._id}`, formData);
    toast.success('Task updated!');
    setEditingTask(null);
    fetchData();
  };

  const handleDeleteTask = async (taskId) => {
    if (!confirm('Delete this task?')) return;
    try { await api.delete(`/tasks/${taskId}`); toast.success('Task deleted'); fetchData(); }
    catch { toast.error('Failed to delete task'); }
  };

  const handleStatusChange = async (taskId, status) => {
    try { await api.patch(`/tasks/${taskId}/status`, { status }); fetchData(); }
    catch { toast.error('Failed to update status'); }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/projects/${id}/members`, { email: memberEmail, role: memberRole });
      toast.success('Member added!');
      setMemberEmail(''); setShowAddMember(false);
      fetchData();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleRemoveMember = async (userId) => {
    if (!confirm('Remove this member?')) return;
    try { await api.delete(`/projects/${id}/members/${userId}`); toast.success('Member removed'); fetchData(); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleDeleteProject = async () => {
    if (!confirm('Delete this project and ALL tasks? This cannot be undone.')) return;
    try { await api.delete(`/projects/${id}`); toast.success('Project deleted'); navigate('/projects'); }
    catch { toast.error('Failed to delete project'); }
  };

  if (loading) return (<><Navbar /><div className="loading-page"><div className="spinner" /></div></>);

  const columns = [
    { key: 'todo', label: 'To Do', color: 'var(--blue)' },
    { key: 'in-progress', label: 'In Progress', color: 'var(--yellow)' },
    { key: 'done', label: 'Done', color: 'var(--green)' },
  ];

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';
  const isOverdue = (d) => d && new Date(d) < new Date();

  return (
    <>
      <Navbar />
      <div className="page fade-in">
        <div className="page-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
              <button className="btn-icon" onClick={() => navigate('/projects')}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
              </button>
              <h1 className="page-title">{project?.name}</h1>
            </div>
            {project?.description && <p className="page-subtitle">{project.description}</p>}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {isAdmin && (
              <button className="btn btn-danger btn-sm" onClick={handleDeleteProject}>Delete Project</button>
            )}
            <button className="btn btn-primary" onClick={() => { setEditingTask(null); setShowTaskModal(true); }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Add Task
            </button>
          </div>
        </div>

        {/* Kanban Board */}
        <div className="kanban">
          {columns.map(col => {
            const colTasks = tasks.filter(t => t.status === col.key);
            return (
              <div key={col.key} className="kanban-column">
                <div className="kanban-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: col.color }} />
                    <span className="kanban-title">{col.label}</span>
                  </div>
                  <span className="kanban-count">{colTasks.length}</span>
                </div>
                <div className="kanban-tasks">
                  {colTasks.map(task => (
                    <div key={task._id} className="task-card" onClick={() => { setEditingTask(task); setShowTaskModal(true); }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                        <span className="task-card-title" style={{ margin: 0 }}>{task.title}</span>
                        {isAdmin && (
                          <button className="btn-icon" style={{ padding: '4px', border: 'none', background: 'transparent' }}
                            onClick={e => { e.stopPropagation(); handleDeleteTask(task._id); }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--red)" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                          </button>
                        )}
                      </div>
                      <div className="task-card-meta">
                        <span className={`badge badge-${task.priority}`}>{task.priority}</span>
                        {task.dueDate && (
                          <span className={`task-card-due ${isOverdue(task.dueDate) && task.status !== 'done' ? 'overdue' : ''}`}>
                            {isOverdue(task.dueDate) && task.status !== 'done' ? '⚠ ' : '📅 '}{formatDate(task.dueDate)}
                          </span>
                        )}
                        {task.assignee && (
                          <div className="avatar avatar-sm" style={{ background: task.assignee.avatarColor }} title={task.assignee.name}>
                            {task.assignee.name?.charAt(0)}
                          </div>
                        )}
                      </div>
                      {/* Quick status buttons */}
                      <div style={{ display: 'flex', gap: '4px', marginTop: '10px' }}>
                        {columns.filter(c => c.key !== task.status).map(c => (
                          <button key={c.key} className="btn btn-secondary btn-sm"
                            style={{ fontSize: '0.7rem', padding: '3px 8px' }}
                            onClick={e => { e.stopPropagation(); handleStatusChange(task._id, c.key); }}>
                            → {c.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Members Section */}
        <div className="members-section" style={{ marginTop: '32px' }}>
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>👥 Team Members ({project?.members?.length})</h3>
              {isAdmin && (
                <button className="btn btn-secondary btn-sm" onClick={() => setShowAddMember(!showAddMember)}>
                  {showAddMember ? 'Cancel' : '+ Add Member'}
                </button>
              )}
            </div>

            {showAddMember && (
              <form onSubmit={handleAddMember} style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                <input className="form-input" value={memberEmail} onChange={e => setMemberEmail(e.target.value)} placeholder="Member email" type="email" required style={{ flex: 1 }} />
                <select className="form-select" value={memberRole} onChange={e => setMemberRole(e.target.value)} style={{ width: '120px' }}>
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
                <button type="submit" className="btn btn-primary btn-sm">Add</button>
              </form>
            )}

            <div className="members-list">
              {project?.members?.map(m => (
                <div key={m.user._id} className="member-item">
                  <div className="avatar" style={{ background: m.user.avatarColor }}>{m.user.name?.charAt(0)}</div>
                  <div className="member-info">
                    <div className="member-name">{m.user.name}</div>
                    <div className="member-role">{m.role} • {m.user.email}</div>
                  </div>
                  {isAdmin && m.user._id !== project.owner?.toString() && m.user._id !== user?._id && (
                    <button className="btn-icon" onClick={() => handleRemoveMember(m.user._id)}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--red)" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Task Modal */}
      {showTaskModal && (
        <TaskModal
          task={editingTask}
          projectMembers={project?.members || []}
          onSave={editingTask ? handleUpdateTask : handleCreateTask}
          onClose={() => { setShowTaskModal(false); setEditingTask(null); }}
        />
      )}
    </>
  );
}
