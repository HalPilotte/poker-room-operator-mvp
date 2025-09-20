import { useState } from 'react';
import PlayerForm from './PlayerForm';
import type { PlayerFormValues } from './playerFormSchema';

const demoValues: PlayerFormValues = {
  first_name: 'Demo',
  last_name: 'Player',
  alias: 'DP',
  date_of_birth: '1990-05-01',
  address: '123 Main St',
  phone: '+15555555555',
  consent: true,
  notes: 'Preferred seat near the dealer.',
  status: 'Active',
};

export const PlayerFormPreview = () => {
  const [lastSubmit, setLastSubmit] = useState<PlayerFormValues | null>(null);
  return (
    <div style={{ maxWidth: 480, padding: 16 }}>
      <PlayerForm
        initialValues={demoValues}
        submitLabel="Save Player"
        onSubmit={(values) => setLastSubmit(values)}
      />
      {lastSubmit && (
        <pre style={{ marginTop: 16 }}>{JSON.stringify(lastSubmit, null, 2)}</pre>
      )}
    </div>
  );
};

export default {
  title: 'Forms/PlayerForm',
  component: PlayerForm,
};
