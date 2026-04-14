import { RouterProvider } from 'react-router';
import { router } from './routes';
import { Toaster } from './components/ui/sonner';
import { useSessionTimeout } from '../hooks/useSessionTimeout';

export default function App() {
  useSessionTimeout(30);

  return (
    <>
      <RouterProvider router={router} />
      <Toaster />
    </>
  );
}