"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
	LayoutDashboard,
	Square,
	UtensilsCrossed,
	Package,
	DollarSign,
	BarChart3,
	CalendarDays,
	Users,
	Clock,
	Settings,
} from "lucide-react";

const navItems = [
	{ href: "/admin", icon: LayoutDashboard, label: "Dashboard" },
	{ href: "/admin/tables", icon: Square, label: "Tables" },
	{ href: "/admin/menu", icon: UtensilsCrossed, label: "Menu" },
	{ href: "/admin/inventory", icon: Package, label: "Inventory" },
	{ href: "/admin/expenses", icon: DollarSign, label: "Expenses" },
	{ href: "/admin/reports", icon: BarChart3, label: "Reports" },
	{ href: "/admin/reservations", icon: CalendarDays, label: "Reservations" },
	{ href: "/admin/cashiers", icon: Users, label: "Cashiers" },
	{ href: "/admin/shifts", icon: Clock, label: "Shifts" },
	{ href: "/admin/settings", icon: Settings, label: "Settings" },
];

export function AdminSidebar() {
	const pathname = usePathname();

	return (
		<aside className="w-64 min-h-screen bg-[rgba(20,36,28,0.85)] border-r border-[rgba(255,255,255,0.08)] flex flex-col">
			<div className="p-6 border-b border-[rgba(255,255,255,0.08)]">
				<h1 className="font-[family-name:var(--font-cormorant)] text-2xl italic text-[#f59e0b]">
					Mahjong Royale
				</h1>
				<p className="text-xs text-[rgba(251,191,36,0.55)] mt-1">Admin Panel</p>
			</div>
			<nav className="flex-1 p-4 space-y-1">
				{navItems.map((item) => {
					const isActive =
						pathname === item.href ||
						(item.href !== "/admin" && pathname.startsWith(item.href));
					return (
						<Link
							key={item.href}
							href={item.href}
							className={cn(
								"flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
								isActive
									? "bg-[rgba(245,158,11,0.15)] text-[#f59e0b] border border-[rgba(251,191,36,0.25)]"
									: "text-[rgba(254,249,236,0.7)] hover:text-[#fef9ec] hover:bg-[rgba(40,56,44,0.6)]",
							)}
						>
							<item.icon size={16} />
							{item.label}
						</Link>
					);
				})}
			</nav>
			<div className="p-4 border-t border-[rgba(255,255,255,0.08)]">
				<Link
					href="/pos/tables"
					className="flex items-center justify-center gap-2 w-full px-3 py-2 rounded-lg text-sm font-medium bg-[rgba(245,158,11,0.12)] border border-[rgba(251,191,36,0.25)] text-[#f59e0b] hover:bg-[rgba(245,158,11,0.2)] transition-colors"
				>
					<Square size={14} />
					Go to POS
				</Link>
			</div>
		</aside>
	);
}
