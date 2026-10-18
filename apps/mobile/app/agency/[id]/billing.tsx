import {useLocalSearchParams} from "expo-router";
import {BillingScreen} from "../../../src/billing-ui";
export default function AgencyBilling(){
 const {id}=useLocalSearchParams<{id:string}>();
 return <BillingScreen agencyId={id}/>;
}
