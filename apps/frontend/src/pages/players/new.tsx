import { api } from '../../lib/api';
import ContentHeader from '../../components/layout/ContentHeader';
import PlayerForm from '../../components/forms/PlayerForm';
import type { PlayerFormValues } from '../../components/forms/playerFormSchema';
import { useSnackbar } from '../../lib/snackbar';

export default function NewPlayerPage() {
  const snackbar = useSnackbar();

  async function onSubmit(values: PlayerFormValues) {
    try {
      const payload = { ...values };
      const created = await api<any>('/players', { method: 'POST', body: JSON.stringify(payload) });
      snackbar.show(`Player created: ${created.first_name} ${created.last_name}`, 'success');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Request failed';
      snackbar.show(message, 'error');
      throw error;
    }
  }

  return (
    <>
      {snackbar.node}
      <ContentHeader title="New Player" subtitle="Only name and date of birth are required. Phone is optional." />
      <PlayerForm submitLabel="Create Player" onSubmit={onSubmit} />
    </>
  );
}
