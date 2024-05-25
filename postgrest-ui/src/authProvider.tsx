import { AuthProvider } from "react-admin";

export const authProvider: AuthProvider = {
    
    // called when the user attempts to log in
    login: ({ username, password }) =>  {
        const request = new Request(`${import.meta.env.VITE_BACKEND_URL}/rpc/login`, {
            method: 'POST',
            body: JSON.stringify({ username, password }),
            headers: new Headers({ 'Content-Type': 'application/json' }),
        });
        return fetch(request)
            .then(response => {
                if (response.status < 200 || response.status >= 300) {
                    throw new Error(response.statusText);
                }
                return response.json();
            })
            .then(auth => {
                localStorage.setItem('auth', JSON.stringify(auth));
            })
            .catch((e) => {
                throw {...e};
            });
    },

    // called when the user clicks on the logout button
    logout: () => {
        localStorage.removeItem("auth");
        return Promise.resolve();
    },
    // called when the API returns an error
    checkError: ({ status }: { status: number }) => {
        if (status === 401 || status === 403) {
            localStorage.removeItem("auth");
            return Promise.reject();
        }
        return Promise.resolve();
    },
    // called when the user navigates to a new location, to check for authentication
    checkAuth: () => (localStorage.getItem('auth')
    ? Promise.resolve()
    : Promise.reject({ message: 'login.required' })),
    // called when the user navigates to a new location, to check for permissions / roles
    getPermissions: () => Promise.resolve(),
};