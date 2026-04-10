import MembershipPolicies from './MembershipPolicies';
import PaymentPolicies from './PaymentPolicies';
import ServicePolicies from './ServicePolicies';

export default function PolicyContent() {
  return (
    <div>
      <MembershipPolicies />
      <PaymentPolicies />
      <ServicePolicies />
    </div>
  );
}
