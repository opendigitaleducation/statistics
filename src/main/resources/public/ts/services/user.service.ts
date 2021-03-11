import http, { AxiosResponse } from 'axios';

export interface App {
    name: string;
    address: string;
    icon: string;
    target: string;
    displayName: string;
    display: boolean;
    prefix: string;
    casType: string;
    scope: Array<string>;
    isExternal: boolean
}

export class UserService {
    
    public async getConnectors(): Promise<Array<App>> {
        const res: AxiosResponse = await http.get('/applications-list');
        if (res.data && res.data.apps) {
            return res.data.apps.filter(app => app.display && app.isExternal);
        }
        return null;
    }
}

export const userService = new UserService();