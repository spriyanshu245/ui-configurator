import { FinancialDetailsComponent } from "@/app/types/types";

interface FinancialDetailsProps {
  component: FinancialDetailsComponent;
}
const FinancialDetails = ({ component }: FinancialDetailsProps) => {
  return <div>Custom component {component.type}</div>;
};

export default FinancialDetails;
