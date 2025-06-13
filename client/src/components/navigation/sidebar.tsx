import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { 
  BarChart3, 
  FlaskRound, 
  ChevronDown, 
  ChevronRight,
  Home,
  Settings,
  Mountain,
  Car,
  Building2,
  Target,
  Layers,
  Scale,
  Shield,
  Users,
  Building,
  LucideIcon,
  HelpCircle,
  FileText,
  Package,
  Book,
  UserCog,
  LogOut,
  User,
  CreditCard
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import SyncStatus from '@/components/ui/sync-status';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

interface MenuChild {
  label: string;
  icon: LucideIcon;
  href: string;
  active?: boolean;
  disabled?: boolean;
}

interface MenuItem {
  label: string;
  icon: LucideIcon;
  href?: string;
  active?: boolean;
  expandable?: boolean;
  expanded?: boolean;
  onToggle?: () => void;
  children?: MenuChild[];
}

export default function Sidebar({ isOpen }: SidebarProps) {
  const [location] = useLocation();
  const [solosOpen, setSolosOpen] = useState(true);
  const [asfaltoOpen, setAsfaltoOpen] = useState(false);
  const [concretoOpen, setConcretoOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const { user, logout } = useAuth();
  const permissions = usePermissions();

  // Build menu items with proper permission checks
  const buildMenuItems = (): MenuItem[] => [
    {
      label: 'Dashboard',
      icon: Home,
      href: '/',
      active: location === '/'
    },
    {
      label: 'Analytics',
      icon: BarChart3,
      href: '/analytics',
      active: location === '/analytics'
    },
    {
      label: 'Laboratório',
      icon: FlaskRound,
      href: '/laboratory',
      active: location === '/laboratory'
    },
    {
      label: 'Ensaios',
      icon: FlaskRound,
      expandable: true,
      expanded: solosOpen,
      onToggle: () => setSolosOpen(!solosOpen),
      children: [
        {
          label: 'Solos',
          icon: Mountain,
          href: '/solos',
          active: location.includes('/solos')
        },
        {
          label: 'Asfalto',
          icon: Car,
          href: '/asfalto',
          active: location.includes('/asfalto'),
          disabled: true
        },
        {
          label: 'Concreto',
          icon: Building2,
          href: '/concreto',
          active: location.includes('/concreto'),
          disabled: true
        }
      ]
    },
    {
      label: 'Gestão de Equipamentos',
      icon: Package,
      expandable: true,
      expanded: asfaltoOpen,
      onToggle: () => setAsfaltoOpen(!asfaltoOpen),
      children: [
        {
          label: 'Equipamentos',
          icon: FlaskRound,
          href: '/equipamentos',
          active: location === '/equipamentos'
        },
        {
          label: 'Verificação de Balança',
          icon: Scale,
          href: '/balanca-verificacao',
          active: location === '/balanca-verificacao'
        }
      ]
    },
    {
      label: 'Relatórios',
      icon: FileText,
      href: '/relatorios',
      active: location === '/relatorios'
    },
    {
      label: 'Assinatura',
      icon: CreditCard,
      href: '/subscription',
      active: location === '/subscription'
    },
    {
      label: 'Configurações',
      icon: Settings,
      href: '/configuracoes',
      active: location === '/configuracoes'
    },
    // Admin section - only for authorized users
    ...(permissions.canManageUsers ? [{
      label: 'Administração',
      icon: Shield,
      expandable: true,
      expanded: adminOpen,
      onToggle: () => setAdminOpen(!adminOpen),
      children: [
        {
          label: 'Painel Admin',
          icon: Settings,
          href: '/admin',
          active: location === '/admin'
        },
        {
          label: 'Usuários',
          icon: Users,
          href: '/admin/users',
          active: location === '/admin/users'
        },
        {
          label: 'Gerenciar Usuários',
          icon: UserCog,
          href: '/admin/user-roles',
          active: location === '/admin/user-roles'
        },
        {
          label: 'Organizações',
          icon: Building,
          href: '/admin/organizations',
          active: location === '/admin/organizations'
        },
        {
          label: 'Criar Usuário',
          icon: UserCog,
          href: '/admin/create-user',
          active: location === '/admin/create-user'
        }
      ]
    }] : []),
    {
      label: 'Ajuda',
      icon: HelpCircle,
      expandable: true,
      expanded: helpOpen,
      onToggle: () => setHelpOpen(!helpOpen),
      children: [
        {
          label: 'Manual do Usuário',
          icon: Book,
          href: '/help/manual-usuario',
          active: location === '/help/manual-usuario'
        },
        {
          label: 'Manual Administrativo',
          icon: UserCog,
          href: '/help/manual-admin',
          active: location === '/help/manual-admin'
        },
        {
          label: 'Teste de Acesso',
          icon: Shield,
          href: '/test-access',
          active: location === '/test-access'
        }
      ]
    }
  ];

  const menuItems = buildMenuItems();

  if (!isOpen) return null;

  return (
    <div className="fixed left-0 top-0 z-40 h-screen w-64 bg-white border-r border-gray-200 shadow-lg flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <img 
            src="/attached_assets/file_00000000233061f898ea05ffe6a1752e_1749721558008.png" 
            alt="LABORATÓRIO Ev.C S" 
            className="w-12 h-8 object-contain"
          />
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Sistema Geotécnico</h2>
            <p className="text-sm text-gray-500">Versão 1.0.0</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <SyncStatus />
        </div>
      </div>

      {/* Navigation */}
      <nav className="p-4 space-y-2 overflow-y-auto flex-1">
        {menuItems.map((item: MenuItem) => (
          <div key={item.label}>
            {item.expandable ? (
              <Collapsible open={item.expanded} onOpenChange={item.onToggle}>
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-between px-3 py-2 h-auto text-left font-normal",
                      "hover:bg-gray-100 text-gray-700"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className="h-5 w-5" />
                      <span>{item.label}</span>
                    </div>
                    {item.expanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-1 mt-1">
                  {item.children?.map((child: MenuChild) => {
                    const content = (
                      <Button
                        variant="ghost"
                        disabled={child.disabled}
                        className={cn(
                          "w-full justify-start px-3 py-2 h-auto text-left font-normal ml-6",
                          child.active
                            ? "bg-blue-100 text-blue-700 border-l-2 border-blue-500"
                            : "hover:bg-gray-100 text-gray-600",
                          child.disabled && "opacity-50 cursor-not-allowed"
                        )}
                      >
                        <child.icon className="h-4 w-4 mr-3" />
                        <span className="text-sm">{child.label}</span>
                      </Button>
                    );

                    return child.disabled ? (
                      <div key={child.label}>{content}</div>
                    ) : (
                      <Link key={child.label} href={child.href}>
                        {content}
                      </Link>
                    );
                  })}
                </CollapsibleContent>
              </Collapsible>
            ) : (
              <Link href={item.href || '#'}>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start px-3 py-2 h-auto text-left font-normal",
                    item.active
                      ? "bg-blue-100 text-blue-700 border-l-2 border-blue-500"
                      : "hover:bg-gray-100 text-gray-700"
                  )}
                >
                  <item.icon className="h-5 w-5 mr-3" />
                  <span>{item.label}</span>
                </Button>
              </Link>
            )}
          </div>
        ))}
      </nav>

      {/* User Info */}
      <div className="mt-auto p-4 border-t border-gray-200 bg-gray-50">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4 text-gray-600" />
            <div className="min-w-0 flex-1">
              <div className="font-medium text-gray-700 truncate">{user?.displayName || user?.email?.split('@')[0] || 'Usuário'}</div>
              <div className="text-xs text-gray-500">
                {permissions.userRole === 'ADMIN' && 'Administrador'}
                {permissions.userRole === 'MANAGER' && 'Gerente'}
                {permissions.userRole === 'SUPERVISOR' && 'Supervisor'}
                {permissions.userRole === 'TECHNICIAN' && 'Técnico'}
                {permissions.userRole === 'VIEWER' && 'Visualizador'}
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={logout}
            className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sair
          </Button>
        </div>
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-gray-200 bg-gray-50">
        <div className="text-xs text-gray-500 text-center">
          <div>Versão 1.0.0</div>
          <div>ABNT NBR 6457/9813</div>
        </div>
      </div>
    </div>
  );
}