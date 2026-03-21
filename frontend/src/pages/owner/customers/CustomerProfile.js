import React from 'react';
import { useParams } from 'react-router-dom';
import GuestFullHistory from '../../components/shared/GuestFullHistory';
import { ownerGuests } from '../../data/ownerData';

export default function CustomerProfile() {
  const { guestId } = useParams();
  const guest = ownerGuests.find(g => g.id === guestId);
  return <GuestFullHistory guest={guest} />;
}
