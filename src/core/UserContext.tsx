import React, { createContext, useContext } from 'react';
import { UserFace } from './types';
import { userEngine } from './UserEngine';

interface UserContextType {
  face: UserFace | null;
}

export const UserContext = createContext<UserContextType>({ face: null });

export const useUserFace = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUserFace must be used within a UserComponent');
  }
  return context.face;
};

export interface UserComponentProps {
  face: UserFace;
  children: React.ReactNode;
  externalRegistries?: string[];
  remoteBundles?: string[];
}

export const UserComponent: React.FC<UserComponentProps> = ({ face, children, remoteBundles }) => {
  const [isReady, setIsReady] = React.useState(false);

  React.useEffect(() => {
    const loadRemoteBundles = async () => {
      if (!remoteBundles || remoteBundles.length === 0) {
        setIsReady(true);
        return;
      }

      // @ts-ignore
      window.userRegistry = {};

      const promises = remoteBundles.map(url => {
        return new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = `${url}?t=${new Date().getTime()}`; // Cache-busting
          script.async = true;
          script.onload = () => {
            console.log(`[UserComponent] Loaded remote bundle: ${url}`);
            resolve(true);
          };
          script.onerror = () => {
            console.error(`[UserComponent] Failed to load remote bundle: ${url}`);
            reject();
          };
          document.head.appendChild(script);
        });
      });

      try {
        await Promise.all(promises);
        // @ts-ignore
        userEngine.registerComponents(window.userRegistry || {});
      } catch (error) {
        console.error('[UserComponent] Error loading remote bundles.', error);
      } finally {
        setIsReady(true);
      }
    };

    loadRemoteBundles();
  }, [remoteBundles]);

  return (
    <UserContext.Provider value={{ face }}>
      {isReady ? children : <div>Loading...</div>}
    </UserContext.Provider>
  );
}; 