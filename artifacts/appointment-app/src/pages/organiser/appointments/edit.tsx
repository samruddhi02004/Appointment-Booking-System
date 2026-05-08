import AppointmentForm from "./new";

export default function OrganiserAppointmentsEdit() {
  // We reuse the new.tsx component which handles both creation and editing based on route params
  return <AppointmentForm />;
}
