import { styled } from '@mui/material/styles';
import PropTypes from 'prop-types';
import { Button, CardContent, CircularProgress } from '@mui/material';
import {
    Form,
    required,
    useTranslate,
    useLogin,
    useNotify,
    useSafeSetState,
} from 'ra-core';
import {FieldValues} from 'react-hook-form';
import { TextInput } from 'react-admin';
import React from 'react';


export const MyLoginForm = (props: MyLoginFormProps) => {
    const {  className } = props;
    const [loading, setLoading] = useSafeSetState(false);
    const login = useLogin();
    const translate = useTranslate();
    const notify = useNotify();

    const submit = (values:FieldValues ,event: React.BaseSyntheticEvent<HTMLFormElement, SubmitEvent>) => {
        //if(event.nativeEvent.submitter)
        const submitter = event.nativeEvent.submitter?.id;
        setLoading(true);
        switch(submitter){
            case 'login':
                login(values, '/')
            .then(() => {
                setLoading(false);
            })
            .catch(error => {
                setLoading(false);
                notify(
                    typeof error === 'string'
                        ? error
                        : typeof error === 'undefined' || !error.message
                        ? 'ra.auth.sign_in_error'
                        : error.message,
                    {
                        type: 'error',
                        messageArgs: {
                            _:
                                typeof error === 'string'
                                    ? error
                                    : error && error.message
                                    ? error.message
                                    : undefined,
                        },
                    }
                );
            });

            break;
            case "signup":
                var request = new Request(`${import.meta.env.VITE_BACKEND_URL}/rpc/signup`, {
            method: 'POST',
            body: JSON.stringify(values),
            headers: new Headers({ 'Content-Type': 'application/json' }),
        });
         fetch(request)
            .then(response => {
                if (response.status < 200 || response.status >= 300) {
                    throw new Error(response.statusText);
                }
                return response.json();
                
            })
            .then(auth => {
                notify(auth);
                setLoading(false); 
            })
            .catch((e) => {
                setLoading(false); 
                throw {...e};
            });
               
        }
        
    };

    return (
        <StyledForm
            onSubmit={(values,event)=>submit(values,event)}
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
                    disabled={loading}
                    fullWidth
                    id='login'
                    className={MyLoginFormClasses.button}
                >
                    {loading ? (
                        <CircularProgress
                            className={MyLoginFormClasses.icon}
                            size={19}
                            thickness={3}
                        />
                    ) : (
                        translate('ra.auth.sign_in')
                    )}
                </Button>
                <Button
                     variant="contained"
                     type="submit"
                     color="primary"
                     disabled={loading}
                     fullWidth
                     id='signup'
                     className={MyLoginFormClasses.button}
                >
                    {loading ? (
                        <CircularProgress
                            className={MyLoginFormClasses.icon}
                            size={19}
                            thickness={3}
                        />
                    ) : (
                        translate('Signup')
                    )}
                </Button>
            </CardContent>
        </StyledForm>
    );
};

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

export interface MyLoginFormProps {
    redirectTo?: string;
    className?: string;
}


MyLoginForm.propTypes = {
    redirectTo: PropTypes.string,
};
