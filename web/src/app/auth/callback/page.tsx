import { Suspense } from 'react';
import AuthCallbackClient from './authcallbackcliente';

export default function Page() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <AuthCallbackClient />
    </Suspense>
  );
}