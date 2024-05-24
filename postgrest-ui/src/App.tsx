import {
  Resource,
  fetchUtils,
  AdminUI,
  AppBar,
  useDataProvider,
  DataProvider,
  localStorageStore,
  AdminContext,
  defaultI18nProvider,
} from "react-admin";
import postgrestRestProvider, {
  IDataProviderConfig,
  defaultPrimaryKeys,
  defaultSchema,
} from "@raphiniert/ra-data-postgrest";
import { authProvider } from "./authProvider";
import { useEffect, useState } from "react";
import { Dashboard } from "./Dashboard";
import TableView, { TableCreate, TableEdit } from "./TableView";
import { MyLoginForm } from "./LoginPage";


const httpClient = (url: string, options: any) => {
  if (!options.headers) {
    options.headers = new Headers({ Accept: "application/json" });
  }
  const { token } = JSON.parse(localStorage.getItem("auth") || "{}");
  options.headers.set("Authorization", `Bearer ${token}`);
  options.headers.set("Access-Control-Expose-Headers", "Content-Range");
  return fetchUtils.fetchJson(url, options);
};

const config: IDataProviderConfig = {
  apiUrl: `http://${import.meta.env.API_HOST}:${import.meta.env.API_PORT}`,
  httpClient: httpClient,
  defaultListOp: "eq",
  primaryKeys: defaultPrimaryKeys,
  schema: defaultSchema,
};
console.log(defaultPrimaryKeys)
const store = localStorageStore();
const dataProvider = postgrestRestProvider(config);

const App = () => (
  <AdminContext
    dataProvider={{
      ...dataProvider,
      
      getResources: async () => {
        const { json } = await httpClient(`http://${import.meta.env.API_HOST}:${import.meta.env.API_PORT}`, {});
        return { data: json };
      },
    }}
    authProvider={authProvider}
    i18nProvider={defaultI18nProvider}
    store={store}
  >

    <AsyncResources />

  </AdminContext>
);
interface MyDataProvider extends DataProvider {
  getResources: () => Promise<{ name: string }[]>;
}

function AsyncResources() {
  const [resources, setResources] = useState<Array<{ name: string }>>(
    [] as Array<{ name: string }>
  );
  const dataProvider = useDataProvider<MyDataProvider>();

  useEffect(() => {
    
      dataProvider.getResources().then((r) => {
        setResources(
          Object.keys(r.data.definitions ? r.data.definitions : {} ).map((key) => ({
            name: key,
            cols:  Object.keys(r.data.definitions[key].properties).map((col) => ({name:col,required: r.data.definitions[key].required.includes(col),...r.data.definitions[key].properties[col]})),
          }))
        );
      });
    
    
  }, [dataProvider]);

  return (
    <AdminUI ready={AppBar} dashboard={Dashboard}   requireAuth={false}
    loginPage = {MyLoginForm}
    >
       {resources.map((resource) => (
        <Resource name={resource.name} key={resource.name} create={TableCreate(resource.cols)} list={TableView(resource.cols)} edit={TableEdit(resource.cols)}/>
      ))} 
          
    </AdminUI>
  );
}

export default App;
