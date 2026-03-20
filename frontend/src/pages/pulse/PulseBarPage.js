import { PulseLayout } from "../../components/pulse/PulseLayout";
import { TapTableView } from "../../components/orders/TapTableView";

export default function PulseBarPage() {
  return (
    <PulseLayout>
      <TapTableView defaultMode="tap" embedded={true} showModeSwitcher={false} />
    </PulseLayout>
  );
}
