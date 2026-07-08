import { Bell, Search, User } from 'lucide-react';

export function Navbar() {
  return (
    <header className="h-16 border-b bg-white flex items-center justify-between px-6 sticky top-0 z-10 w-full">
      <div className="flex items-center bg-gray-100 rounded-md px-3 py-1.5 w-64">
        <Search className="w-4 h-4 text-gray-500 mr-2" />
        <input 
          type="text" 
          placeholder="Global Search. Try 'John Doe'" 
          className="bg-transparent border-none outline-none text-sm w-full"
        />
      </div>
      <div className="flex items-center space-x-6">
        <button className="text-gray-500 hover:text-gray-700 relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>
        <div className="flex items-center space-x-2 cursor-pointer">
          <div className="w-8 h-8 bg-sky-500 rounded-full text-white flex items-center justify-center font-bold text-sm">
            AD
          </div>
          <span className="text-sm font-medium text-gray-700">Admin User</span>
        </div>
      </div>
    </header>
  );
}
