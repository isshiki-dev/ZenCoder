import { prisma } from '@/lib/prisma';
import { History, Activity, Terminal, Clock } from 'lucide-react';

export default async function Dashboard() {
  const stats = {
    totalConversations: await prisma.conversation.count(),
    totalMessages: await prisma.message.count(),
    totalToolExecutions: await prisma.toolExecution.count(),
    successRate: 0,
  };

  const successCount = await prisma.toolExecution.count({ where: { status: 'success' } });
  stats.successRate = stats.totalToolExecutions ? (successCount / stats.totalToolExecutions) * 100 : 0;

  const recentLogs = await prisma.toolExecution.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-end">
        <div>
           <h1 className="text-3xl font-bold text-gray-900">Platform Dashboard</h1>
           <p className="text-gray-500">Monitor your AI agent's performance and activity.</p>
        </div>
        <a href="/" className="text-blue-600 hover:underline text-sm font-medium">Back to Chat</a>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Conversations" value={stats.totalConversations} icon={<History size={20} />} />
        <StatCard title="Messages" value={stats.totalMessages} icon={<Activity size={20} />} />
        <StatCard title="Tool Executions" value={stats.totalToolExecutions} icon={<Terminal size={20} />} />
        <StatCard title="Success Rate" value={`${stats.successRate.toFixed(1)}%`} icon={<Clock size={20} />} />
      </div>

      <section className="bg-white p-6 rounded-xl shadow-sm border">
        <h2 className="text-xl font-semibold mb-6">Recent Tool Executions</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                <th className="pb-3">Tool</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">Duration</th>
                <th className="pb-3">Executed At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recentLogs.map((log: any) => (
                <tr key={log.id} className="text-sm">
                  <td className="py-4 font-mono text-blue-600">{log.toolName}</td>
                  <td className="py-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${log.status === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                      {log.status}
                    </span>
                  </td>
                  <td className="py-4 text-gray-500">{log.duration}ms</td>
                  <td className="py-4 text-gray-400">{new Date(log.createdAt).toLocaleString()}</td>
                </tr>
              ))}
              {recentLogs.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-gray-400">No tool executions found yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function StatCard({ title, value, icon }: any) {
  return (
    <div className="bg-white p-6 rounded-xl border shadow-sm flex items-center gap-4">
      <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">{icon}</div>
      <div>
        <div className="text-xs font-medium text-gray-400 uppercase tracking-wider">{title}</div>
        <div className="text-2xl font-bold text-gray-900">{value}</div>
      </div>
    </div>
  );
}
