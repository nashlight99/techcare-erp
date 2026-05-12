export const STATUS_COLORS: Record<string, string> = {
  received: 'bg-gray-100 text-gray-700',
  in_progress: 'bg-blue-100 text-blue-700',
  waiting_parts: 'bg-yellow-100 text-yellow-700',
  waiting_customer: 'bg-purple-100 text-purple-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
}

export const STATUS_LABELS: Record<string, string> = {
  received: 'Reçu',
  in_progress: 'En cours',
  waiting_parts: 'Attente pièces',
  waiting_customer: 'Attente client',
  completed: 'Terminé',
  cancelled: 'Annulé',
}
