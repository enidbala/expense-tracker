'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, LayoutDashboard, LogOut, Plus, User, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

// Define menu items array
const menuItems = [
    {
        title: 'Expenses',
        icon: <LayoutDashboard className="h-4 w-4" />,
        path: '/admin/expenses',
    },
    {
        title: 'New Expense',
        icon: <Plus className="h-4 w-4" />,
        path: '/admin/new-expense',
    },
    {
        title: 'My Account',
        icon: <User className="h-4 w-4" />,
        path: '/admin/account',
    }
];

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
    const pathname = usePathname();
    const router = useRouter();

    // Check if the user is logged in when the layout is loaded
    useEffect(() => {
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                router.push('/');
            } else {
                setIsLoggedIn(true);
            }
        };

        checkSession();
    }, [router]);

    // Close mobile menu when route changes
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [pathname]);

    // Logout function
    const handleLogout = async () => {
        const { error } = await supabase.auth.signOut();

        if (error) {
            console.error('Error logging out:', error.message);
        } else {
            router.push('/');
        }
    };

    return (
        <div className="min-h-screen flex flex-col md:flex-row">
            {/* Mobile Header with Menu Button */}
            <div className="bg-gray-900 text-white p-4 flex items-center justify-between md:hidden">
                <h1 className="text-xl font-bold">Financat</h1>
                <Button
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-gray-800"
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                >
                    {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
                </Button>
            </div>

            {/* Sidebar Navigation - Hidden on mobile by default, shown when menu clicked */}
            <div
                className={cn(
                    "bg-gray-900 text-white transition-all duration-300",
                    // Desktop styles
                    "hidden md:block",
                    isCollapsed ? "md:w-16" : "md:w-64",
                    // Mobile styles - absolute positioning when open
                    isMobileMenuOpen ? "block fixed inset-0 z-50" : ""
                )}
            >
                {/* Desktop Sidebar Header */}
                <div className="p-4 hidden md:flex items-center justify-between">
                    {!isCollapsed && (
                        <h1 className="text-xl font-bold">My Finance</h1>
                    )}
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-white hover:bg-gray-800"
                        onClick={() => setIsCollapsed(!isCollapsed)}
                    >
                        <Menu className="h-4 w-4" />
                    </Button>
                </div>

                {/* Mobile Sidebar Header with Close Button */}
                <div className="p-4 flex md:hidden items-center justify-between">
                    <h1 className="text-xl font-bold">My Finance</h1>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-white hover:bg-gray-800"
                        onClick={() => setIsMobileMenuOpen(false)}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                {/* Navigation Items */}
                <nav className="mt-4">
                    {menuItems.map((item) => (
                        <Link
                            key={item.path}
                            href={item.path}
                            className={cn(
                                "flex items-center px-4 py-2 hover:bg-gray-800",
                                pathname === item.path && "bg-gray-800"
                            )}
                        >
                            {item.icon}
                            {(!isCollapsed || isMobileMenuOpen) && (
                                <span className="ml-2">{item.title}</span>
                            )}
                        </Link>
                    ))}
                    <button
                        onClick={handleLogout}
                        className={cn(
                            "flex items-center px-4 py-2 hover:bg-gray-800 w-full text-left"
                        )}
                    >
                        <LogOut className="h-4 w-4" />
                        {(!isCollapsed || isMobileMenuOpen) && <span className="ml-2">Logout</span>}
                    </button>
                </nav>
            </div>

            {/* Main Content */}
            <div className="flex-1 bg-gray-100">
                <main className="p-6">{children}</main>
            </div>

            {/* Overlay for mobile menu */}
            {isMobileMenuOpen && (
                <div 
                    className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}
        </div>
    );
}