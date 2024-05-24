import { TextInput } from "react-admin";
import { styled } from '@mui/material/styles';
import {Card} from "@mui/material";
import { Button, CardContent, CircularProgress } from '@mui/material';
import {
    Form,
    required,
    useTranslate,
    useLogin,
    useRedirect,
    useNotify,
    usePermissions,
    useAuthenticated,
    useSafeSetState,
} from 'ra-core';

export interface MyRegisterProps {
    redirectTo?: string;
    className?: string;
}


export const RegisterPage = (props: MyRegisterProps)=>{ 
    //useAuthenticated({enabled:false});
     const {  className } = props;
     const translate = useTranslate();
     //const [loading, setLoading] = useSafeSetState(false);

     return(
        <Card>
<StyledForm 
             onSubmit={(e)=>console.log(e)}
             mode="onChange"
             noValidate
             className={className}
         >
             <CardContent className={MyLoginFormClasses.content}>
                 <TextInput
                     autoFocus
                     source="username"
                     label={translate('ra.auth.username')}
                     autoComplete="username"
                     validate={required()}
                     fullWidth
                 />
                 <TextInput
                     source="password"
                     label={translate('ra.auth.password')}
                     type="password"
                     autoComplete="current-password"
                     validate={required()}
                     fullWidth
                 />
                 <Button
                     variant="contained"
                     type="submit"
                     color="primary"
                     //disabled={loading}
                     fullWidth
                     className={MyLoginFormClasses.button}
                 >
                     {
                         translate('ra.auth.sign_in')
                     }
                 </Button>
             </CardContent>
         </StyledForm>
        </Card>
         
     )
}
const PREFIX = 'RaLoginForm';

export const MyLoginFormClasses = {
    content: `${PREFIX}-content`,
    button: `${PREFIX}-button`,
    icon: `${PREFIX}-icon`,
};

const StyledForm = styled(Form, {
    name: PREFIX,
    overridesResolver: (props, styles) => styles.root,
})(({ theme }) => ({
    [`& .${MyLoginFormClasses.content}`]: {
        width: 300,
    },
    [`& .${MyLoginFormClasses.button}`]: {
        marginTop: theme.spacing(2),
    },
    [`& .${MyLoginFormClasses.icon}`]: {
        margin: theme.spacing(0.3),
    },
}));