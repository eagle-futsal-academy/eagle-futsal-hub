import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/SupabaseAuthContext';
import { Plus } from 'lucide-react';

export default function Players() {
  const { players = [] } = useData();
  const { isAdmin } = useAuth();
  
  // Basic compute logic for stats
  // In a real app we'd parse matches to find goals and apps. 
  // For now we'll just display players list.
  
  const activePlayers = players.filter((p: any) => p.is_active !== false);
  const inactivePlayers = players.filter((p: any) => p.is_active === false);
  
  return (
    <div className="p-4 md:p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Daftar Pemain</h1>
        </div>
        {isAdmin && (
          <button className="flex items-center px-4 py-2 bg-green-900 text-white rounded-md hover:bg-green-800 shadow">
            <Plus size={18} className="mr-2" /> Tambah Pemain
          </button>
        )}
      </div>
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No Punggung</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Posisi</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                {isAdmin && <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {activePlayers.map((player: any) => (
                <tr key={player.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{player.number || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">{player.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{player.position}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Aktif</span>
                  </td>
                  {isAdmin && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                      <button className="text-blue-600 hover:text-blue-900 mr-3">Edit</button>
                      <button className="text-red-600 hover:text-red-900">Nonaktifkan</button>
                    </td>
                  )}
                </tr>
              ))}
              
              {/* Inactive Players */}
              {inactivePlayers.map((player: any) => (
                <tr key={player.id} className="bg-yellow-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{player.number || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">{player.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{player.position}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">Nonaktif</span>
                  </td>
                  {isAdmin && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                      <button className="text-blue-600 hover:text-blue-900">Aktifkan</button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
