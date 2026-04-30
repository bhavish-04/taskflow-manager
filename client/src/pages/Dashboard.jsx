import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Navbar from '../components/Navbar';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/dashboard/stats')
      .then(res => setData(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (<><Navbar /><div className="loading-page"><div className="spinner" /></div></>);

  const { stats, priorities, projectCount, overdueTasks, myTasks } = data || {};

  const formatDate = (d) => {
    if (!d) return '';
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const isOverdue = (d) => d && new Date(d) < new Date() ;

  return (
    <>
      <Navbar />
      <div className="page fade-in">
        <div className="page-header">
          <div>
            <h1 className="page-title">Dashboard</h1>
            <p className="page-subtitle">Overview of your tasks and projects</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-4" style={{ marginBottom: '28px' }}>
          <div className="card stat-card">
            <div className="stat-value" style={{ color: 'var(--accent-light)' }}>{projectCount || 0}</div>
            <div className="stat-label">Projects</div>
          </div>
          <div className="card stat-card">
            <div className="stat-value" style={{ color: 'var(--blue)' }}>{stats?.todo || 0}</div>
            <div className="stat-label">To Do</div>
          </div>
          <div className="card stat-card">
            <div className="stat-value" style={{ color: 'var(--yellow)' }}>{stats?.['in-progress'] || 0}</div>
            <div className="stat-label">In Progress</div>
          </div>
          <div className="card stat-card">
            <div className="stat-value" style={{ color: 'var(--green)' }}>{stats?.done || 0}</div>
            <div className="stat-label">Completed</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          {/* My Tasks */}
          <div className="card">
            <h3 style={{ marginBottom: '16px', fontSize: '1rem', fontWeight: 700 }}>
              <span style={{ marginRight: '8px' }}>📋</span>My Active Tasks
            </h3>
            {myTasks?.length ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {myTasks.map(task => (
                  <div key={task._id} className="task-card" onClick={() => navigate(`/projects/${task.project?._id}`)}>
                    <div className="task-card-title">{task.title}</div>
                    <div className="task-card-meta">
                      <span className={`badge badge-${task.status}`}>{task.status}</span>
                      <span className={`badge badge-${task.priority}`}>{task.priority}</span>
                      {task.dueDate && (
                        <span className={`task-card-due ${isOverdue(task.dueDate) ? 'overdue' : ''}`}>
                          {isOverdue(task.dueDate) ? '⚠ ' : '📅 '}{formatDate(task.dueDate)}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state" style={{ padding: '30px' }}>
                <p>No active tasks assigned to you</p>
              </div>
            )}
          </div>

          {/* Overdue Tasks */}
          <div className="card">
            <h3 style={{ marginBottom: '16px', fontSize: '1rem', fontWeight: 700 }}>
              <span style={{ marginRight: '8px' }}>⚠️</span>Overdue Tasks
            </h3>
            {overdueTasks?.length ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {overdueTasks.map(task => (
                  <div key={task._id} className="task-card" onClick={() => navigate(`/projects/${task.project?._id}`)}>
                    <div className="task-card-title">{task.title}</div>
                    <div className="task-card-meta">
                      <span className={`badge badge-${task.priority}`}>{task.priority}</span>
                      <span className="task-card-due overdue">⚠ {formatDate(task.dueDate)}</span>
                      {task.project && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{task.project.name}</span>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state" style={{ padding: '30px' }}>
                <p style={{ color: 'var(--green)' }}>🎉 No overdue tasks!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
