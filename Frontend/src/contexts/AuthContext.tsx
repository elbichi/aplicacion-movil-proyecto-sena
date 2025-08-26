//Conteto Global de autenticacion 

//importar dependencais
import React,{createContext,useContext, useEfFect,useState,ReactNode } from 'React';
import {authService} from '../services/auth'; //Servicio de autenticacion
import {User,LoginCredentials,LoginReponse} from '../types'; //tipos TypeScript

//Interfaz de contexto
interface AuthContextType{
    user:User|null;
    isAuthenticated:boolean;
    isLoading:boolean;

    //funcion de auntenticacin
    login: (credentials:LoginCredentials) => Promise<LoginReponse>;
    logout: () => Promise<void>;
    refresh: () => Promise<void>;
    //verificar permiso
    canDelete: () => boolean;
    canEdit: () => boolean;
    hasRole: (role:'admin'|'coordinador') => boolean;

}
const AuthContext = createContext<AuthContextType | undefined>(undefined);
interface AuthProviderProps{
    children:ReactNode;
}
export const AuthProvider: React.FC<AuthProviderProps> = ({
    children}) =>{
        const [user,setUser] = useState<User|null>(null);
        const [isLoading,setIsLoading] = useState<boolean>(true);
        useEffect(()=>{
            checkAuthStatus().finally(() => setIsLoading(false));
        },[])
    }



