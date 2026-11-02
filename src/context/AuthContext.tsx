import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  firebaseSignOut,
  auth,
  googleProvider,
  db,
} from '../firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { UserRole, Member, AdminUser } from '../types';
import { BOOTSTRAP_ADMIN_EMAIL, registerMemberProfile } from '../services/db';
import { generateNextMemberId } from '../utils/calculations';

interface AuthContextType {
  user: User | null;
  role: UserRole;
  adminProfile: AdminUser | null;
  linkedMember: Member | null;
  loading: boolean;
  isAdmin: boolean;
  isMember: boolean;
  isSuperAdmin: boolean;
  loginWithGoogle: (preferredRole?: 'admin' | 'member') => Promise<void>;
  loginWithEmail: (email: string, pass: string, roleType?: 'admin' | 'member') => Promise<void>;
  registerMemberAccount: (params: {
    email: string;
    password: string;
    nameBn: string;
    phone: string;
    address: string;
    emergencyContact?: string;
    photoUrl?: string;
    existingMemberIds: string[];
  }) => Promise<Member>;
  loginAsDemoAdmin: (targetRole?: UserRole) => void;
  loginAsDemoMember: (member: Member) => void;
  setLinkedMemberDirectly: (member: Member | null) => void;
  logout: () => Promise<void>;
  simulateRole: (role: UserRole) => void;
  isSimulated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole>('super_admin');
  const [adminProfile, setAdminProfile] = useState<AdminUser | null>({
    uid: 'bootstrap_admin',
    email: BOOTSTRAP_ADMIN_EMAIL,
    role: 'super_admin',
    name: 'ইরফান রাহাত (সুপার অ্যাডমিন)',
  });
  const [linkedMember, setLinkedMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSimulated, setIsSimulated] = useState(false);

  // Sync auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setIsSimulated(false);
        // 1. Check if email matches bootstrap super admin
        if (currentUser.email === BOOTSTRAP_ADMIN_EMAIL) {
          setRole('super_admin');
          setAdminProfile({
            uid: currentUser.uid,
            email: currentUser.email,
            role: 'super_admin',
            name: currentUser.displayName || 'সুপার অ্যাডমিন',
          });
        } else {
          // 2. Check in admins collection
          try {
            const adminDoc = await getDoc(doc(db, 'admins', currentUser.uid));
            if (adminDoc.exists()) {
              const data = adminDoc.data() as AdminUser;
              setRole(data.role || 'officer');
              setAdminProfile(data);
            } else {
              // Not an admin document, consider as member
              setRole('member');
              setAdminProfile(null);
            }
          } catch (e) {
            console.warn('Notice reading admin doc:', e);
            setRole('member');
          }
        }

        // 3. Check if linked to a member profile
        try {
          const membersRef = collection(db, 'members');
          const qUid = query(membersRef, where('linkedUserId', '==', currentUser.uid));
          const snapUid = await getDocs(qUid);
          if (!snapUid.empty) {
            setLinkedMember(snapUid.docs[0].data() as Member);
          } else if (currentUser.email) {
            const qEmail = query(membersRef, where('linkedEmail', '==', currentUser.email));
            const snapEmail = await getDocs(qEmail);
            if (!snapEmail.empty) {
              setLinkedMember(snapEmail.docs[0].data() as Member);
            }
          }
        } catch (e) {
          console.warn('Notice reading linked member doc:', e);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async (preferredRole: 'admin' | 'member' = 'admin') => {
    try {
      setLoading(true);
      const res = await signInWithPopup(auth, googleProvider);
      if (preferredRole === 'member') {
        setRole('member');
      } else if (res.user.email === BOOTSTRAP_ADMIN_EMAIL) {
        setRole('super_admin');
      }
    } catch (error) {
      console.error('Google Sign-In failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const loginWithEmail = async (
    email: string,
    pass: string,
    roleType: 'admin' | 'member' = 'member'
  ) => {
    try {
      setLoading(true);
      const res = await signInWithEmailAndPassword(auth, email.trim(), pass);
      if (roleType === 'admin') {
        setRole('super_admin');
        setAdminProfile({
          uid: res.user.uid,
          email: res.user.email || email,
          role: 'super_admin',
          name: res.user.displayName || 'অ্যাডমিন',
        });
      } else {
        setRole('member');
      }
    } catch (error) {
      console.error('Email sign in failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const registerMemberAccount = async (params: {
    email: string;
    password: string;
    nameBn: string;
    phone: string;
    address: string;
    emergencyContact?: string;
    photoUrl?: string;
    existingMemberIds: string[];
  }): Promise<Member> => {
    try {
      setLoading(true);
      // 1. Create Firebase Auth user
      const userCred = await createUserWithEmailAndPassword(auth, params.email.trim(), params.password);
      await updateProfile(userCred.user, {
        displayName: params.nameBn,
      });

      // 2. Generate unique Member ID
      const nextMemberId = generateNextMemberId(params.existingMemberIds);

      // 3. Create Member Profile in Firestore
      const newMember = await registerMemberProfile({
        memberId: nextMemberId,
        nameBn: params.nameBn.trim(),
        phone: params.phone.trim(),
        address: params.address.trim(),
        emergencyContact: params.emergencyContact?.trim(),
        email: params.email.trim(),
        uid: userCred.user.uid,
        photoUrl: params.photoUrl?.trim(),
      });

      // 4. Update local context state
      setUser(userCred.user);
      setRole('member');
      setLinkedMember(newMember);
      setIsSimulated(false);

      return newMember;
    } catch (error) {
      console.error('Member registration failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const loginAsDemoAdmin = (targetRole: UserRole = 'super_admin') => {
    setRole(targetRole);
    setAdminProfile({
      uid: 'demo_admin',
      email: BOOTSTRAP_ADMIN_EMAIL,
      role: targetRole,
      name: 'ইরফান রাহাত (প্রধান অ্যাডমিন)',
    });
    setIsSimulated(true);
  };

  const loginAsDemoMember = (member: Member) => {
    setRole('member');
    setLinkedMember(member);
    setIsSimulated(true);
  };

  const setLinkedMemberDirectly = (member: Member | null) => {
    setLinkedMember(member);
  };

  const logout = async () => {
    try {
      await firebaseSignOut(auth);
      setUser(null);
      setRole('member'); // default to member view after logout
      setAdminProfile(null);
      setLinkedMember(null);
      setIsSimulated(false);
    } catch (error) {
      console.error('Sign-out failed:', error);
    }
  };

  const simulateRole = (newRole: UserRole) => {
    setRole(newRole);
    setIsSimulated(true);
  };

  const isAdmin =
    role === 'super_admin' ||
    role === 'president' ||
    role === 'general_secretary' ||
    role === 'treasurer' ||
    role === 'officer';

  const isMember = role === 'member';
  const isSuperAdmin = role === 'super_admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        adminProfile,
        linkedMember,
        loading,
        isAdmin,
        isMember,
        isSuperAdmin,
        loginWithGoogle,
        loginWithEmail,
        registerMemberAccount,
        loginAsDemoAdmin,
        loginAsDemoMember,
        setLinkedMemberDirectly,
        logout,
        simulateRole,
        isSimulated,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

