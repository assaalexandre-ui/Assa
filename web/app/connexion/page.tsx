import { Logo } from '@/components/Logo';
import { FormConnexion } from './FormConnexion';

export default function Connexion() {
  return (
    <main style={{ padding: '0 16px' }}>
      <div className="gate">
        <div className="brand-login"><Logo couleur="var(--ink)" /></div>
        <h1>Connexion</h1>
        <p className="muted" style={{ margin: 0 }}>Gestion de l&apos;église · version de test</p>
        <FormConnexion />
        <p className="muted" style={{ margin: 0, fontSize: 12.5 }}>Pas encore de compte ? Demandez-le à l&apos;administration de l&apos;église.</p>
      </div>
    </main>
  );
}
