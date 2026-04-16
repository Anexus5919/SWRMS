import 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      employeeId: string;
      name: string;
      role: 'admin' | 'supervisor' | 'staff';
      ward: string;
      assignedRouteId: string | null;
    };
  }

  interface User {
    id: string;
    employeeId: string;
    name: string;
    role: 'admin' | 'supervisor' | 'staff';
    ward: string;
    assignedRouteId: string | null;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    employeeId: string;
    role: 'admin' | 'supervisor' | 'staff';
    ward: string;
    assignedRouteId: string | null;
  }
}
