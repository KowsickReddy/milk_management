import React from 'react';
import { Menu, Bell, Plus, Search, User } from 'lucide-react';
import { Button } from '../ui';

export default function Navbar({ title, onMenuClick, onAddClick }) {
  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-200">
      <div className="flex items-center justify-between h-16 px-4">
        {/* Left: Menu + Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            className="p-2 rounded-lg hover:bg-gray-100 md:hidden"
          >
            <Menu className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Search - Desktop only */}
          <button className="hidden md:flex p-2 rounded-lg hover:bg-gray-100">
            <Search className="w-5 h-5" />
          </button>

          {/* Notifications */}
          <button className="p-2 rounded-lg hover:bg-gray-100 relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
          </button>

          {/* Add button */}
          {onAddClick && (
            <Button onClick={onAddClick} icon={Plus} className="hidden sm:flex">
              Add New
            </Button>
          )}

          {/* User avatar */}
          <button className="p-2 rounded-lg hover:bg-gray-100">
            <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
          </button>
        </div>
      </div>
    </header>
  );
}