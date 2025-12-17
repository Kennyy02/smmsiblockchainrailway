import { useState, useEffect, useRef } from 'react';
import { Link, usePage, router } from '@inertiajs/react';
import { 
    LayoutGrid, 
    Users, 
    Settings, 
    BookOpen,
    FileText,
    ChevronDown, 
    ChevronRight,
    Menu, 
    X,
    User,
    GraduationCap,
    School,
    Target,
    Calendar,
    Clock,
    Bell,
    ClipboardCheck,
    Database,
    BookMarked,
    FolderOpen,
    UserCheck,
    Library,
    Tag,
    Mail,
} from 'lucide-react';

const SchoolLogo = () => {
    return (
        <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white flex items-center justify-center shadow-lg overflow-hidden">
                <img
                    src="/logo.png"
                    alt="School Logo"
                    className="w-full h-full object-contain p-1"
                />
            </div>
            <div className="hidden sm:block">
                <div className="text-white font-bold text-[10px] sm:text-xs leading-tight">SOUTHERN MINDORO</div>
                <div className="text-white font-bold text-[10px] sm:text-xs leading-tight">MARITIME SCHOOL</div>
                <div className="text-blue-300 text-[8px] italic">Blockchain Grading System</div>
            </div>
        </div>
    );
};

interface NavItemWithSubmenu {
    title: string;
    href: string;
    icon?: React.ComponentType<any>;
    submenu?: NavItemWithSubmenu[];
    id?: number;
    isParentActive?: boolean;
}

interface DropdownMenuItemProps {
    item: NavItemWithSubmenu;
    isActive: boolean;
    isMobile?: boolean;
    closeDropdowns: () => void;
    activeDropdownId: number | null;
    setActiveDropdownId: (id: number | null) => void;
}

const DropdownMenuItem = ({ 
    item, 
    isActive, 
    isMobile = false,
    closeDropdowns,
    activeDropdownId,
    setActiveDropdownId
}: DropdownMenuItemProps) => {
    const [localMobileOpen, setLocalMobileOpen] = useState(false);

    const isCurrentlyOpen = isMobile 
        ? localMobileOpen 
        : activeDropdownId === item.id;

    const toggleDropdown = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (isMobile) {
            setLocalMobileOpen(!localMobileOpen);
        } else if (setActiveDropdownId && item.id !== undefined) {
            setActiveDropdownId(activeDropdownId === item.id ? null : item.id);
        }
    };

    const handleSubmenuClick = () => {
        closeDropdowns();
        if (!isMobile) {
            setActiveDropdownId(null);
        }
    }

    const baseStyles = "text-white/90 hover:text-white hover:bg-white/10 transition-all duration-300";
    
    const activeStyles = isActive || item.isParentActive
        ? "bg-blue-600 text-white font-semibold shadow-lg"
        : baseStyles;

    if (!item.submenu || item.submenu.length === 0) {
        return (
            <Link
                href={item.href}
                className={`flex items-center py-1.5 px-3 rounded-lg text-xs ${activeStyles} ${isMobile ? 'w-full' : ''}`}
                onClick={closeDropdowns}
            >
                {item.icon && <item.icon className="mr-1.5 h-4 w-4 flex-shrink-0" />}
                <span className="truncate">{item.title}</span>
            </Link>
        );
    }

    return (
        <div className={`relative ${isMobile ? 'w-full' : ''}`}>
            <button
                onClick={toggleDropdown}
                className={`flex items-center justify-between py-1.5 px-3 rounded-lg w-full text-xs ${activeStyles}`}
                aria-expanded={isCurrentlyOpen}
                aria-haspopup="true"
            >
                <div className="flex items-center">
                    {item.icon && <item.icon className="mr-1.5 h-4 w-4 flex-shrink-0" />}
                    <span className="truncate">{item.title}</span>
                </div>
                <ChevronRight className={`h-3.5 w-3.5 transition-transform duration-300 ${isCurrentlyOpen ? 'transform rotate-90' : ''}`} />
            </button>

            {isCurrentlyOpen && (
                <div className={`${isMobile ? 'ml-3 mt-1.5 space-y-1' : 'absolute left-0 mt-1.5 w-52 rounded-lg shadow-2xl bg-blue-800 ring-1 ring-white/20 z-50 overflow-hidden'} transition-all duration-300`}>
                    {item.submenu.map((subItem, index) => {
                        const subIsActive = window.location.pathname === subItem.href;
                        return (
                            <Link
                                key={index}
                                href={subItem.href}
                                className={`block px-3 py-2 text-xs ${isMobile ? 'rounded-lg' : ''} ${
                                    subIsActive 
                                        ? 'bg-blue-600 text-white font-semibold' 
                                        : 'text-white/90 hover:bg-white/10 hover:text-white'
                                } transition-all duration-300`}
                                onClick={handleSubmenuClick}
                            >
                                <div className="flex items-center">
                                    {subItem.icon && <subItem.icon className="mr-1.5 h-3.5 w-3.5 flex-shrink-0" />}
                                    <span className="truncate">{subItem.title}</span>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

function AppHeader() {
    const { auth } = usePage().props as any;
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [activeDropdown, setActiveDropdown] = useState<number | null>(null);
    
    const userRole = auth.user?.role || 'student';

    const closeAllDropdowns = () => {
        setMobileMenuOpen(false);
        setUserMenuOpen(false);
        setActiveDropdown(null);
    };

    const handleLogout = () => {
        router.post('/logout');
    };

    const userMenuRef = useRef<HTMLDivElement>(null);
    const desktopNavRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
                setUserMenuOpen(false);
            }
            if (desktopNavRef.current && !desktopNavRef.current.contains(event.target as Node)) {
                setActiveDropdown(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 10);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // ADMIN NAVIGATION
    const adminNavItemsData: NavItemWithSubmenu[] = [
        { 
            title: 'Dashboard', 
            href: '/admin/dashboard', 
            icon: LayoutGrid 
        },
        {
            title: 'Academic',
            href: '/admin/academic-years',
            icon: BookOpen,
            submenu: [
                { title: 'Academic Years', href: '/admin/academic-years', icon: Calendar },
                { title: 'Semesters', href: '/admin/semesters', icon: Clock },
                { title: 'Curriculum Subjects', href: '/admin/curriculum-subjects', icon: Target },
            ]
        },
        {
            title: 'Curriculum',
            href: '/admin/courses',
            icon: BookMarked,
            submenu: [
                { title: 'Courses/Programs', href: '/admin/courses', icon: GraduationCap },
                { title: 'Subjects', href: '/admin/subjects', icon: BookOpen },
                { title: 'Classes', href: '/admin/classes', icon: School },
                { title: 'Class-Subject', href: '/admin/class-subjects', icon: ClipboardCheck },
            ]
        },
        {
            title: 'Library',
            href: '/admin/library',
            icon: Library,
            submenu: [
                { title: 'All Books', href: '/admin/library', icon: BookOpen },
                { title: 'Categories', href: '/admin/categories', icon: Tag },
            ]
        },
        {
            title: 'People',
            href: '/admin/teachers',
            icon: Users,
            submenu: [
                { title: 'Teachers', href: '/admin/teachers', icon: UserCheck },
                { title: 'Students', href: '/admin/students', icon: GraduationCap },
                { title: 'Parents', href: '/admin/parents', icon: User },
            ]
        },
        {
            title: 'Course Materials',
            href: '/admin/course-materials',
            icon: FolderOpen,
        },
        { 
            title: 'Blockchain', 
            href: '/admin/blockchain-transactions', 
            icon: Database 
        },
        { 
            title: 'Announcements', 
            href: '/admin/announcements', 
            icon: Bell 
        },
        { 
            title: 'Contact Messages', 
            href: '/admin/contact-messages', 
            icon: Mail 
        },
    ];

    // TEACHER NAVIGATION
    const teacherNavItemsData: NavItemWithSubmenu[] = [
        { 
            title: 'Dashboard', 
            href: '/teacher/dashboard', 
            icon: LayoutGrid 
        },
        { 
            title: 'My Classes', 
            href: '/teacher/my-classes', 
            icon: School,
            submenu: [
                { title: 'All Classes', href: '/teacher/my-classes', icon: School },
                { title: 'My Subjects', href: '/teacher/my-subjects', icon: BookOpen },
            ]
        },
        {
            title: 'Course Materials',
            href: '/teacher/course-materials',
            icon: FolderOpen,
        },
        {
            title: 'Records',
            href: '/teacher/grades',
            icon: FileText,
            submenu: [
                { title: 'Grades', href: '/teacher/grades', icon: FileText },
                { title: 'Attendance', href: '/teacher/attendance', icon: ClipboardCheck },
            ]
        },
    ];

    // STUDENT NAVIGATION
    const studentNavItemsData: NavItemWithSubmenu[] = [
        { 
            title: 'Dashboard', 
            href: '/student/dashboard', 
            icon: LayoutGrid 
        },
        { 
            title: 'My Subjects', 
            href: '/student/my-subjects', 
            icon: BookOpen 
        },
        {
            title: 'Course Materials',
            href: '/student/course-materials',
            icon: FolderOpen,
        },
        {
            title: 'My Records',
            href: '/student/grades',
            icon: FileText,
            submenu: [
                { title: 'My Grades', href: '/student/grades', icon: FileText },
                { title: 'My Attendance', href: '/student/attendance', icon: ClipboardCheck },
            ]
        },
    ];

    // PARENT NAVIGATION
    const parentNavItemsData: NavItemWithSubmenu[] = [
        { 
            title: 'Dashboard', 
            href: '/parent/dashboard', 
            icon: LayoutGrid 
        },
        { 
            title: 'My Children', 
            href: '/parent/children', 
            icon: Users 
        },
        {
            title: "Child's Records",
            href: '/parent/grades',
            icon: FileText,
            submenu: [
                { title: "Grades", href: '/parent/grades', icon: FileText },
                { title: "Attendance", href: '/parent/attendance', icon: ClipboardCheck },
            ]
        },
    ];

    // Select navigation based on user role
    const baseNavItems = userRole === 'admin' 
        ? adminNavItemsData 
        : userRole === 'teacher' 
            ? teacherNavItemsData 
            : userRole === 'parent'
                ? parentNavItemsData
                : studentNavItemsData;

    const mainNavItems = baseNavItems.map((item, index) => {
        const isParentActive = item.submenu?.some(sub => window.location.pathname === sub.href) || window.location.pathname === item.href;
        return { 
            ...item, 
            id: index, // Using index for local dropdown state management
            isParentActive 
        };
    });

    const homeLink = userRole === 'admin' 
        ? '/admin/dashboard' 
        : userRole === 'teacher' 
            ? '/teacher/dashboard' 
            : userRole === 'parent'
                ? '/parent/dashboard'
                : '/student/dashboard';

    // Get role badge color
    const getRoleBadge = () => {
        switch(userRole) {
            case 'admin':
                return { color: 'bg-red-600', label: 'Administrator' };
            case 'teacher':
                return { color: 'bg-green-600', label: 'Teacher' };
            case 'parent':
                return { color: 'bg-purple-600', label: 'Parent' };
            default:
                return { color: 'bg-blue-600', label: 'Student' };
        }
    };

    const roleBadge = getRoleBadge();

    return (
        <header 
            className={`sticky top-0 z-40 w-full transition-all duration-500 ${
                scrolled 
                    ? 'bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900 shadow-2xl' 
                    : 'bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900'
            }`}
        >
            <div className="mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex h-14 items-center justify-between">
                    {/* Left - Logo */}
                    <div className="flex items-center flex-shrink-0">
                        <Link href={homeLink} className="flex items-center">
                            <SchoolLogo />
                        </Link>
                    </div>

                    {/* Center - Desktop Navigation */}
                    <nav className="hidden lg:flex lg:space-x-0.5 absolute left-1/2 transform -translate-x-1/2" ref={desktopNavRef}>
                        {mainNavItems.map((item) => (
                            <DropdownMenuItem 
                                key={item.id} 
                                item={item} 
                                isActive={window.location.pathname === item.href}
                                isMobile={false}
                                closeDropdowns={closeAllDropdowns}
                                activeDropdownId={activeDropdown}
                                setActiveDropdownId={setActiveDropdown}
                            />
                        ))}
                    </nav>
                    
                    <div className="flex-1 lg:hidden"></div>

                    {/* Right - User Menu */}
                    <div className="flex items-center space-x-2">
                        {/* Mobile menu button */}
                        <button
                            type="button"
                            className="lg:hidden inline-flex items-center justify-center p-2 rounded-lg text-white hover:bg-white/10 transition-all duration-300"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        >
                            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                        </button>

                        {/* User Menu */}
                        <div className="relative" ref={userMenuRef}>
                            <button 
                                className="flex items-center max-w-xs text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 hover:bg-white/10 px-2 py-1.5 transition-all duration-300"
                                onClick={() => {
                                    setUserMenuOpen(!userMenuOpen);
                                    setActiveDropdown(null);
                                }}
                            >
                                <div className="h-7 w-7 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center overflow-hidden shadow-lg">
                                    {auth.user?.avatar ? (
                                        <img 
                                            src={`/storage/${auth.user.avatar}`}    
                                            alt="User avatar" 
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <User className="h-4 w-4 text-white" />
                                    )}
                                </div>
                                <span className="ml-2 text-white text-xs font-semibold hidden sm:block truncate max-w-[100px]">
                                    {auth.user?.name || 'User'}
                                </span>
                                <ChevronDown className={`ml-1 h-3.5 w-3.5 text-white hidden sm:block transition-transform duration-300 ${userMenuOpen ? 'transform rotate-180' : ''}`} />
                            </button>

                            {/* User Dropdown */}
                            {userMenuOpen && (
                                <div className="origin-top-right absolute right-0 mt-1.5 w-52 rounded-lg shadow-2xl bg-white ring-1 ring-black/5 z-50 overflow-hidden">
                                    <div className="px-4 py-3 bg-gradient-to-br from-blue-50 to-blue-100 border-b border-blue-200">
                                        <p className="text-xs font-bold text-gray-900 truncate">{auth.user?.name || 'User'}</p>
                                        <p className="text-[10px] text-gray-600 truncate">{auth.user?.email || ''}</p>
                                        <span className={`inline-flex items-center px-2 py-0.5 mt-1.5 rounded-full text-[10px] font-medium ${roleBadge.color} text-white`}>
                                            {roleBadge.label}
                                        </span>
                                    </div>
                                    <div className="py-1.5">
                                        <Link 
                                            href={
                                                userRole === 'admin' ? '/settings/profile' : 
                                                userRole === 'teacher' ? '/settings/profile' : 
                                                userRole === 'parent' ? '/settings/profile' : 
                                                '/settings/profile'
                                            } 
                                            className="block px-4 py-2 text-xs text-gray-700 hover:bg-blue-50 transition-all duration-300"
                                            onClick={() => setUserMenuOpen(false)}
                                        >
                                            Your Profile
                                        </Link>
                                        <Link 
                                            href={
                                                userRole === 'admin' ? '/settings' : 
                                                '/settings'
                                            } 
                                            className="block px-4 py-2 text-xs text-gray-700 hover:bg-blue-50 transition-all duration-300"
                                            onClick={() => setUserMenuOpen(false)}
                                        >
                                            Settings
                                        </Link>
                                    </div>
                                    <div className="py-1.5 border-t border-gray-200">
                                        <button 
                                            className="block w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-blue-50 transition-all duration-300"
                                            onClick={handleLogout}
                                        >
                                            Sign out
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile menu */}
            <div className={`lg:hidden transition-all duration-500 ease-in-out ${mobileMenuOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                <div className="px-4 pt-3 pb-4 space-y-1.5 bg-blue-800 shadow-2xl border-t border-white/10">
                    {mainNavItems.map((item) => (
                        <div key={item.id} className="mb-1.5">
                            <DropdownMenuItem 
                                item={item} 
                                isActive={window.location.pathname === item.href} 
                                isMobile={true}
                                closeDropdowns={closeAllDropdowns}
                                activeDropdownId={null}
                                setActiveDropdownId={() => {}}
                            />
                        </div>
                    ))}
                </div>
            </div>
        </header>
    );
}

export { AppHeader };
export default AppHeader;