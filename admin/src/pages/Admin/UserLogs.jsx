import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const UserLogs = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const baseUrl = import.meta.env.VITE_BACKEND_URL;
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!user) {
      setError('User not logged in');
      setLoading(false);
      return;
    }

    const fetchLogs = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await axios.post(
          `${baseUrl}/api/user/get-logs`,
          { userId: user._id },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setLogs(res.data.logs);
      } catch (err) {
        setError(err.response?.data?.message || err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [user, baseUrl, token]);

  return (
    <div className="m-5 max-w-3xl">
      <h2 className="text-xl font-semibold mb-4">User Logs</h2>

      {loading && <p>Loading logs...</p>}
      {error && <p className="text-red-600">Error: {error}</p>}

      {!loading && !error && logs.length === 0 && <p>No logs found.</p>}

      {!loading && !error && logs.length > 0 && (
        <ul className="space-y-2">
          {logs
            .slice() // to avoid mutating original
            .reverse() // reverse to show newest first
            .map((log) => (
              <li
                key={log._id}
                className="border rounded p-3 bg-white shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm"
              >
                <span className="min-w-[150px] font-semibold whitespace-nowrap overflow-hidden text-ellipsis">
                  {new Date(log.loginTime).toLocaleString()}
                </span>
                <span className="flex-1 min-w-[100px] truncate">
                  IP: {log.ipAddress || 'N/A'}
                </span>
                <span className="flex-1 min-w-[150px] truncate">
                  UA: {log.userAgent || 'N/A'}
                </span>
              </li>
            ))}
        </ul>
      )}
    </div>
  );
};

export default UserLogs;
