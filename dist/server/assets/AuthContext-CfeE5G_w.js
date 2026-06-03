import { jsx } from "react/jsx-runtime";
import { useContext, useState, useEffect, createContext } from "react";
import { s as supabase$1 } from "./client-Bkk6o3Z0.js";
const supabase = supabase$1;
const IS_SUPABASE_CONFIGURED = true;
const AuthContext = createContext(void 0);
const PROFILE_LOAD_TIMEOUT_MS = 5e3;
const withProfileTimeout = async (promise) => {
  let timeoutId;
  try {
    return await Promise.race([
      promise,
      new Promise((resolve) => {
        timeoutId = setTimeout(() => resolve(null), PROFILE_LOAD_TIMEOUT_MS);
      })
    ]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
};
const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const isSupabaseConfigured = IS_SUPABASE_CONFIGURED;
  const buildFallbackUser = (sessionUser) => ({
    id: sessionUser.id,
    email: sessionUser.email || "",
    first_name: sessionUser.user_metadata?.first_name || "User",
    middle_name: sessionUser.user_metadata?.middle_name || "",
    last_name: sessionUser.user_metadata?.last_name || "",
    phone: sessionUser.user_metadata?.phone || "",
    role: sessionUser.user_metadata?.role || "citizen",
    is_verified: false,
    account_status: "active"
  });
  const fetchUserProfile = async (userId) => {
    try {
      const { data, error } = await supabase.from("users").select("*").eq("id", userId).maybeSingle();
      if (error) {
        console.warn("[Auth] Profile fetch error (may be RLS):", error.message);
        try {
          const { data: rpcData } = await supabase.rpc("get_user_profile", { p_user_id: userId });
          if (rpcData && rpcData.length > 0) return rpcData[0];
        } catch (rpcErr) {
          console.warn("[Auth] RPC fallback also failed:", rpcErr);
        }
        return null;
      }
      if (!data) {
        console.warn("[Auth] No profile row for user", userId, "— will use fallback");
        return null;
      }
      return data;
    } catch (error) {
      console.error("[Auth] fetchUserProfile exception:", error);
      return null;
    }
  };
  const refreshProfile = async () => {
    if (session?.user?.id) {
      const profile = await fetchUserProfile(session.user.id);
      setUser(profile);
    }
  };
  useEffect(() => {
    let isMounted = true;
    const initializeSession = async () => {
      try {
        const timeoutPromise = new Promise((resolve) => {
          setTimeout(() => resolve({ data: { session: null } }), 15e3);
        });
        const sessionPromise = supabase.auth.getSession();
        const { data: { session: currentSession } } = await Promise.race([sessionPromise, timeoutPromise]);
        if (!isMounted) return;
        setSession(currentSession);
        if (currentSession?.user) {
          setUser(buildFallbackUser(currentSession.user));
          try {
            const profile = await withProfileTimeout(fetchUserProfile(currentSession.user.id));
            if (!isMounted) return;
            if (profile) setUser(profile);
          } catch (profileErr) {
            console.warn("[Auth] Profile fetch failed, keeping fallback user:", profileErr);
          }
        } else {
          setUser(null);
        }
      } catch (error) {
        if (!isMounted) return;
        console.error("[Auth] Session init error:", error);
        const { data } = await supabase.auth.getSession().catch(() => ({ data: { session: null } }));
        if (!data?.session) {
          setSession(null);
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    initializeSession();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      console.log("[Auth] State change:", event, !!newSession);
      if (event === "SIGNED_OUT") {
        setSession(null);
        setUser(null);
        setIsLoading(false);
        return;
      }
      if (newSession?.user) {
        setSession(newSession);
        setUser((prev) => prev || buildFallbackUser(newSession.user));
        setTimeout(() => {
          void withProfileTimeout(fetchUserProfile(newSession.user.id)).then((profile) => {
            if (isMounted && profile) setUser(profile);
          });
        }, 0);
        setIsLoading(false);
      } else if (event !== "TOKEN_REFRESHED") {
        setSession(null);
        setUser(null);
        setIsLoading(false);
      }
    });
    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [isSupabaseConfigured]);
  const signIn = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };
  const signUp = async (email, password, userData) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: userData }
    });
    return { error, user: data?.user };
  };
  const signOut = async () => {
    setUser(null);
    setSession(null);
    try {
      await Promise.race([
        supabase.auth.signOut(),
        new Promise((_, reject) => setTimeout(() => reject(new Error("signOut timeout")), 5e3))
      ]);
    } catch {
    }
  };
  const updateUser = async (data) => {
    const { error } = await supabase.auth.updateUser({ data });
    return { error };
  };
  return /* @__PURE__ */ jsx(AuthContext.Provider, { value: { user, session, isLoading, signIn, signUp, signOut, updateUser, fetchUserProfile, refreshProfile }, children });
};
const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
const AuthContext$1 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  AuthProvider,
  useAuth
}, Symbol.toStringTag, { value: "Module" }));
export {
  AuthContext$1 as A,
  IS_SUPABASE_CONFIGURED as I,
  supabase as s,
  useAuth as u
};
